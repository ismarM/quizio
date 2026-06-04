package shared

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

const (
	// DefaultLimit is used when pagination requests omit a limit.
	DefaultLimit = int32(20)
	// MaxLimit caps pagination requests.
	MaxLimit = int32(100)
)

// WriteJSON writes a JSON response with the provided HTTP status.
func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(payload)
}

// WriteError writes the API's standard error response.
func WriteError(w http.ResponseWriter, status int, code, message string) {
	WriteJSON(w, status, ErrorResponse{
		Error:   code,
		Message: message,
	})
}

// DecodeJSON decodes a JSON request body and rejects unknown or trailing fields.
func DecodeJSON(r *http.Request, dst any) error {
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

// ParseIDParam reads a positive int32 path parameter.
func ParseIDParam(r *http.Request, name string) (int32, error) {
	value := chi.URLParam(r, name)
	id, err := strconv.Atoi(value)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return int32(id), nil
}

// NormalizeLimit applies the API's pagination limit defaults and cap.
func NormalizeLimit(limit int32) int32 {
	if limit <= 0 {
		return DefaultLimit
	}
	if limit > MaxLimit {
		return MaxLimit
	}
	return limit
}

// ParseQueryInt32 reads an int32 query parameter or returns the provided default.
func ParseQueryInt32(r *http.Request, name string, defaultValue int32) (int32, error) {
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

// ParseQueryBool reads a bool query parameter or returns the provided default.
func ParseQueryBool(r *http.Request, name string, defaultValue bool) (bool, error) {
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
