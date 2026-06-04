package users

import "net/http"

// DeleteUser godoc
// @Summary Delete user account
// @Description Delete the authenticated user account.
// @Tags users
// @Produce json
// @Success 204
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me [delete]
func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	if err := h.queries.DeleteUser(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "delete_user_failed", "failed to delete user")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}
