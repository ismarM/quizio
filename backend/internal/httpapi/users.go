package httpapi

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/ismarM/quizio/internal/db/sqlc"
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
func (api *API) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if req.Email == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "email is required")
		return
	}

	user, err := api.queries.CreateUser(r.Context(), sqlc.CreateUserParams{
		Email:          req.Email,
		IsAdmin:        req.IsAdmin,
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
func (api *API) GetUserInfo(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	user, err := api.queries.GetUserByID(r.Context(), userID)
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
func (api *API) UpdateDisplayName(w http.ResponseWriter, r *http.Request) {
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

	user, err := api.queries.UpdateUserDisplayName(r.Context(), sqlc.UpdateUserDisplayNameParams{
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
func (api *API) UpdateRole(w http.ResponseWriter, r *http.Request) {
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

	user, err := api.queries.UpdateUserRole(r.Context(), sqlc.UpdateUserRoleParams{
		IDUser:  userID,
		IsAdmin: req.IsAdmin,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update_role_failed", "failed to update role")
		return
	}

	writeJSON(w, http.StatusOK, UserResponse{User: userDTO(user)})
}

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
func (api *API) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
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

	user, err := api.queries.UpdateUserPreferences(r.Context(), sqlc.UpdateUserPreferencesParams{
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

// DeleteUser godoc
// @Summary Delete user account
// @Description Delete the authenticated user account.
// @Tags users
// @Produce json
// @Success 204
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me [delete]
func (api *API) DeleteUser(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	if err := api.queries.DeleteUser(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "delete_user_failed", "failed to delete user")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}

// GetOpenSessions godoc
// @Summary Get open sessions
// @Description Return attempts that are in progress and not expired for the authenticated user.
// @Tags users
// @Produce json
// @Success 200 {object} OpenSessionsResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me/open-sessions [get]
func (api *API) GetOpenSessions(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	if err := api.queries.FinalizeExpiredAttemptsForUser(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "finalize_attempts_failed", "failed to finalize expired attempts")
		return
	}

	rows, err := api.queries.ListOpenAttemptsByUser(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list_open_sessions_failed", "failed to list open sessions")
		return
	}

	response := OpenSessionsResponse{Attempts: make([]AttemptSessionDTO, 0, len(rows))}
	for _, row := range rows {
		attempt := AttemptDTO{
			ID:               row.IDAttempt,
			StartTime:        row.StartTime,
			TimeTakenSeconds: nullTimeToSeconds(row.TimeTaken),
			QuizID:           row.TkQuiz,
			UserID:           row.TkUser,
		}
		response.Attempts = append(response.Attempts, AttemptSessionDTO{
			Attempt:          attempt,
			TimeLimitSeconds: row.TimeLimitSeconds,
		})
	}

	writeJSON(w, http.StatusOK, response)
}

// GetSubmissions godoc
// @Summary Get submissions
// @Description Return finished attempts and raw data for scoring for the authenticated user.
// @Tags users
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} SubmissionsResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me/submissions [get]
func (api *API) GetSubmissions(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	limit, err := parseQueryInt32(r, "limit", defaultLimit)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid limit")
		return
	}
	offset, err := parseQueryInt32(r, "offset", 0)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid offset")
		return
	}
	limit = normalizeLimit(limit)
	if offset < 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "offset must be non-negative")
		return
	}

	if err := api.queries.FinalizeExpiredAttemptsForUser(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "finalize_attempts_failed", "failed to finalize expired attempts")
		return
	}

	rows, err := api.queries.ListFinishedAttemptsByUser(r.Context(), sqlc.ListFinishedAttemptsByUserParams{
		TkUser: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list_submissions_failed", "failed to list submissions")
		return
	}

	results := make([]AttemptResultResponse, 0, len(rows))
	for _, row := range rows {
		attempt := attemptDTOFromAttempt(row)
		result, err := api.buildAttemptResult(r.Context(), attempt, row.TkQuiz, true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
			return
		}
		results = append(results, result)
	}

	writeJSON(w, http.StatusOK, SubmissionsResponse{
		Results: results,
		Limit:   limit,
		Offset:  offset,
	})
}

func userDTO(user sqlc.QuizioUser) UserDTO {
	return UserDTO{
		ID:             user.IDUser,
		Email:          user.Email,
		IsAdmin:        user.IsAdmin,
		DisplayName:    nullStringPtr(user.Displayname),
		Language:       user.Language,
		Theme:          user.Theme,
		ProfilePicture: nullStringPtr(user.ProfilePicture),
	}
}

func toNullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *value, Valid: true}
}
