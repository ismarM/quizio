package httpapi

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

const (
	defaultLimit = int32(20)
	maxLimit     = int32(100)
)

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, ErrorResponse{
		Error:   code,
		Message: message,
	})
}

func decodeJSON(r *http.Request, dst any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return errors.New("invalid json payload")
	}
	return nil
}

func parseIDParam(r *http.Request, name string) (int32, error) {
	value := chi.URLParam(r, name)
	id, err := strconv.Atoi(value)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return int32(id), nil
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func nullTimePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}
	return &value.Time
}

func nullTimeToSeconds(value sql.NullTime) *int32 {
	if !value.Valid {
		return nil
	}
	seconds := int32(value.Time.Hour()*3600 + value.Time.Minute()*60 + value.Time.Second())
	return &seconds
}

func normalizeLimit(limit int32) int32 {
	if limit <= 0 {
		return defaultLimit
	}
	if limit > maxLimit {
		return maxLimit
	}
	return limit
}

func parseQueryInt32(r *http.Request, name string, defaultValue int32) (int32, error) {
	value := r.URL.Query().Get(name)
	if value == "" {
		return defaultValue, nil
	}
	parsed, err := strconv.ParseInt(value, 10, 32)
	if err != nil {
		return 0, errors.New("invalid query parameter")
	}
	return int32(parsed), nil
}

func parseQueryBool(r *http.Request, name string, defaultValue bool) (bool, error) {
	value := r.URL.Query().Get(name)
	if value == "" {
		return defaultValue, nil
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return false, errors.New("invalid query parameter")
	}
	return parsed, nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}

func generatePlaceholderURL() (string, error) {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	return "/static/images/" + hex.EncodeToString(buffer) + ".png", nil
}
