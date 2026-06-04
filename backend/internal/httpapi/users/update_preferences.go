package users

import (
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// UpdatePreferences godoc
// @Summary Update preferences
// @Description Update theme and language for the authenticated user.
// @Tags users
// @Accept json
// @Produce json
// @Param request body UpdatePreferencesRequest true "Update preferences"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me/preferences [patch]
func (h *Handler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	var req UpdatePreferencesRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	user, err := h.queries.UpdateUserPreferences(r.Context(), sqlc.UpdateUserPreferencesParams{
		IDUser:   userID,
		Language: req.Language,
		Theme:    req.Theme,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update_preferences_failed", "failed to update preferences")
		return
	}

	writeJSON(w, http.StatusOK, UserResponse{User: userDTO(user)})
}
