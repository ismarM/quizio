package shared

import (
	"database/sql"
	"errors"

	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgconn"
)

// Deps contains shared backend dependencies used by HTTP route packages.
type Deps struct {
	DB      *sql.DB
	Queries *sqlc.Queries
}

// IsUniqueViolation reports whether err is a Postgres unique constraint violation.
func IsUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
