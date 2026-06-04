package users

import (
	"database/sql"
	"errors"
	"net/http"
)

// GetUserInfo godoc
// @Summary Get user info
// @Description Get role, theme, language, and profile fields for the authenticated user.
// @Tags users
// @Produce json
// @Success 200 {object} UserResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me [get]
func (h *Handler) GetUserInfo(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	user, err := h.queries.GetUserByID(r.Context(), userID)
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
