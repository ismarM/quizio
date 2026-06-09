package users

import (
	"database/sql"
	"errors"
	"github.com/go-chi/chi/v5"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
	"strconv"
)

// UpdateRole godoc
// @Summary Update user role
// @Description Update admin role. Admins can grant admin access to any user; admins can only revoke admin access from themselves.
// @Tags users
// @Accept json
// @Produce json
// @Param userId path int true "User ID"
// @Param request body UpdateRoleRequest true "Update user role"
// @Success 200 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/{userId}/role [patch]
func (h *Handler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	targetUserID, err := strconv.ParseInt(chi.URLParam(r, "userId"), 10, 32)
	if err != nil || targetUserID <= 0 {
		writeError(w, http.StatusBadRequest, "invalid_user", "invalid user ID")
		return
	}

	var req UpdateRoleRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "admin access required")
		return
	}

	if !req.IsAdmin && int32(targetUserID) != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "admins can only revoke their own admin access")
		return
	}

	user, err := h.queries.UpdateUserRole(r.Context(), sqlc.UpdateUserRoleParams{
		IDUser:  int32(targetUserID),
		IsAdmin: req.IsAdmin,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "user not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "update_role_failed", "failed to update role")
		return
	}

	writeJSON(w, http.StatusOK, UserResponse{User: userDTO(user)})
}
