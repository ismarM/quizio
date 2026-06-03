package httpapi

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"strconv"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
)

type LeaderboardHub struct {
	db          *sql.DB
	fetchFn     func(context.Context, int32) (*LeaderboardResponse, error)
	mu          sync.RWMutex
	subscribers map[int32]map[chan *LeaderboardResponse]struct{}
	pending     map[int32]struct{}
}

func NewLeaderboardHub(db *sql.DB, fetchFn func(context.Context, int32) (*LeaderboardResponse, error)) *LeaderboardHub {
	return &LeaderboardHub{
		db:          db,
		fetchFn:     fetchFn,
		subscribers: make(map[int32]map[chan *LeaderboardResponse]struct{}),
		pending:     make(map[int32]struct{}),
	}
}

// Start runs the postgres listener loop
func (h *LeaderboardHub) Start(ctx context.Context) {
	go h.listenPostgres(ctx)
}

func (h *LeaderboardHub) Subscribe(quizID int32) chan *LeaderboardResponse {
	h.mu.Lock()
	defer h.mu.Unlock()

	ch := make(chan *LeaderboardResponse, 10)
	if _, ok := h.subscribers[quizID]; !ok {
		h.subscribers[quizID] = make(map[chan *LeaderboardResponse]struct{})
	}
	h.subscribers[quizID][ch] = struct{}{}
	return ch
}

func (h *LeaderboardHub) Unsubscribe(quizID int32, ch chan *LeaderboardResponse) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if subs, ok := h.subscribers[quizID]; ok {
		delete(subs, ch)
		close(ch)
		if len(subs) == 0 {
			delete(h.subscribers, quizID)
		}
	}
}

func (h *LeaderboardHub) Broadcast(quizID int32, data *LeaderboardResponse) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if subs, ok := h.subscribers[quizID]; ok {
		for ch := range subs {
			select {
			case ch <- data:
			default:
				// Buffer full or slow consumer, skip to prevent blocking
			}
		}
	}
}

func (h *LeaderboardHub) listenPostgres(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		err := h.runListener(ctx)
		if err != nil {
			log.Printf("Postgres listener error: %v, retrying in 5 seconds...", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(5 * time.Second):
			}
		}
	}
}

func (h *LeaderboardHub) runListener(ctx context.Context) error {
	// db.Conn(ctx) returns a *sql.Conn representing a single dedicated connection
	sqlConn, err := h.db.Conn(ctx)
	if err != nil {
		return err
	}
	defer sqlConn.Close()

	var pgxConn *pgx.Conn
	err = sqlConn.Raw(func(driverConn any) error {
		stdlibConn, ok := driverConn.(*stdlib.Conn)
		if !ok {
			return errors.New("not a pgx connection")
		}
		pgxConn = stdlibConn.Conn()
		return nil
	})
	if err != nil {
		return err
	}

	_, err = pgxConn.Exec(ctx, "LISTEN leaderboard_update")
	if err != nil {
		return err
	}
	defer func() {
		// Clean up on disconnect/exit
		unlistenCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_, _ = pgxConn.Exec(unlistenCtx, "UNLISTEN leaderboard_update")
	}()

	log.Println("Postgres leaderboard_update listener started successfully")

	for {
		notification, err := pgxConn.WaitForNotification(ctx)
		if err != nil {
			return err
		}

		payload := notification.Payload
		if quizIDInt, err := strconv.ParseInt(payload, 10, 32); err == nil {
			quizID := int32(quizIDInt)
			h.triggerUpdate(quizID)
		}
	}
}

func (h *LeaderboardHub) triggerUpdate(quizID int32) {
	h.mu.Lock()
	if _, exists := h.pending[quizID]; exists {
		h.mu.Unlock()
		return // Update already scheduled for this quiz ID
	}
	h.pending[quizID] = struct{}{}
	h.mu.Unlock()

	// Debounce per quiz ID
	go func() {
		time.Sleep(100 * time.Millisecond)

		h.mu.Lock()
		delete(h.pending, quizID)
		h.mu.Unlock()

		// Fetch and broadcast using context.Background() as this runs asynchronously
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		leaderboard, err := h.fetchFn(ctx, quizID)
		if err != nil {
			log.Printf("Error calculating leaderboard for quiz %d during notification: %v", quizID, err)
			return
		}

		h.Broadcast(quizID, leaderboard)
	}()
}
