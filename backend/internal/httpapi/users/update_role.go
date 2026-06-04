package users

import (
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// UpdateRole godoc
// @Summary Update user role
// @Description Update admin role for the authenticated user.
// @Tags users
// @Accept json
// @Produce json
// @Param request body UpdateRoleRequest true "Update user role"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me/role [patch]
func (h *Handler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	var req UpdateRoleRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	user, err := h.queries.UpdateUserRole(r.Context(), sqlc.UpdateUserRoleParams{
		IDUser:  userID,
		IsAdmin: req.IsAdmin,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update_role_failed", "failed to update role")
		return
	}

	writeJSON(w, http.StatusOK, UserResponse{User: userDTO(user)})
}
