package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

const defaultDBTimeout = 5 * time.Second

func Open(ctx context.Context, dsn string) (*sql.DB, error) {
	database, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, defaultDBTimeout)
	defer cancel()

	if err := database.PingContext(pingCtx); err != nil {
		_ = database.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}

	return database, nil
}
