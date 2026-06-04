package users

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
)

// GetUserByEmail godoc
// @Summary Lookup user by email
// @Description Resolve user ID and role by email (BFF only).
// @Tags users
// @Produce json
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/lookup [get]
func (h *Handler) GetUserByEmail(w http.ResponseWriter, r *http.Request) {
	email := strings.TrimSpace(r.Header.Get("X-User-Email"))
	if email == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "email is required")
		return
	}

	user, err := h.queries.GetUserByEmail(r.Context(), email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "user not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_user_failed", "failed to load user")
		return
	}

	writeJSON(w, http.StatusOK, UserResponse{User: userDTO(user)})
}
