package db

import (
	"context"
	"database/sql"
	"fmt"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func Migrate(ctx context.Context, database *sql.DB, migrationsDir string) error {
	if err := database.PingContext(ctx); err != nil {
		return fmt.Errorf("ping db: %w", err)
	}

	migrationsPath, err := filepath.Abs(migrationsDir)
	if err != nil {
		return fmt.Errorf("resolve migrations path: %w", err)
	}
	migrationsPath = filepath.ToSlash(migrationsPath)
	sourceURL := "file://" + migrationsPath

	driver, err := postgres.WithInstance(database, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("create migrate driver: %w", err)
	}

	migrator, err := migrate.NewWithDatabaseInstance(
		sourceURL,
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	if err := migrator.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("run migrations: %w", err)
	}

	sourceErr, dbErr := migrator.Close()
	if sourceErr != nil {
		return fmt.Errorf("close migration source: %w", sourceErr)
	}
	if dbErr != nil {
		return fmt.Errorf("close migration db: %w", dbErr)
	}

	return nil
}
