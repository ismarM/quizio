package httpapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
)

const (
	dbTimeout         = 3 * time.Second
	defaultUsersLimit = 50
	maxUsersLimit     = 100
)

type UsersHandler struct {
	DB *sql.DB
}

type User struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type createUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (h UsersHandler) List(w http.ResponseWriter, r *http.Request) {
	limit, err := parseLimit(r.URL.Query().Get("limit"))
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), dbTimeout)
	defer cancel()

	rows, err := h.DB.QueryContext(ctx, `
        SELECT id, name, email, created_at
        FROM users
        ORDER BY id DESC
        LIMIT $1
    `, limit)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "query users")
		return
	}
	defer rows.Close()

	users := make([]User, 0, limit)
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt); err != nil {
			writeJSONError(w, http.StatusInternalServerError, "scan users")
			return
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		writeJSONError(w, http.StatusInternalServerError, "iterate users")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

func (h UsersHandler) Create(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req createUserRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json body")
		return
	}
	if err := ensureEOF(decoder); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid json body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)
	if req.Name == "" || req.Email == "" {
		writeJSONError(w, http.StatusBadRequest, "name and email are required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), dbTimeout)
	defer cancel()

	user := User{Name: req.Name, Email: req.Email}
	err := h.DB.QueryRowContext(ctx, `
        INSERT INTO users (name, email)
        VALUES ($1, $2)
        RETURNING id, created_at
    `, user.Name, user.Email).Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			writeJSONError(w, http.StatusConflict, "email already exists")
			return
		}
		writeJSONError(w, http.StatusInternalServerError, "create user")
		return
	}

	writeJSON(w, http.StatusCreated, user)
}

func parseLimit(raw string) (int, error) {
	if raw == "" {
		return defaultUsersLimit, nil
	}

	limit, err := strconv.Atoi(raw)
	if err != nil || limit <= 0 {
		return 0, errors.New("limit must be a positive integer")
	}

	if limit > maxUsersLimit {
		return maxUsersLimit, nil
	}

	return limit, nil
}

func ensureEOF(decoder *json.Decoder) error {
	if decoder.Decode(&struct{}{}) != io.EOF {
		return errors.New("extra data after json object")
	}
	return nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
