package users

import (
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// CreateUser godoc
// @Summary Create user
// @Description Create a new user.
// @Tags users
// @Accept json
// @Produce json
// @Param request body CreateUserRequest true "Create user request"
// @Success 201 {object} UserResponse
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users [post]
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if req.Email == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "email is required")
		return
	}

	user, err := h.queries.CreateUser(r.Context(), sqlc.CreateUserParams{
		Email:          req.Email,
		IsAdmin:        false,
		Displayname:    toNullString(req.DisplayName),
		Language:       req.Language,
		Theme:          req.Theme,
		ProfilePicture: toNullString(req.ProfilePicture),
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "user_exists", "user already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "create_user_failed", "failed to create user")
		return
	}

	writeJSON(w, http.StatusCreated, UserResponse{User: userDTO(user)})
}
