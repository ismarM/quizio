package users

import (
	"database/sql"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// UpdateDisplayName godoc
// @Summary Update display name
// @Description Update display name for the authenticated user.
// @Tags users
// @Accept json
// @Produce json
// @Param request body UpdateDisplayNameRequest true "Update display name"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me/display-name [patch]
func (h *Handler) UpdateDisplayName(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	var req UpdateDisplayNameRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if req.DisplayName == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "display_name is required")
		return
	}

	user, err := h.queries.UpdateUserDisplayName(r.Context(), sqlc.UpdateUserDisplayNameParams{
		IDUser:      userID,
		Displayname: sql.NullString{String: req.DisplayName, Valid: true},
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "display_name_taken", "display name already in use")
			return
		}
		writeError(w, http.StatusInternalServerError, "update_user_failed", "failed to update user")
		return
	}

	writeJSON(w, http.StatusOK, UserResponse{User: userDTO(user)})
}
