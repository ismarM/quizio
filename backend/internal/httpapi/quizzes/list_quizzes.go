package quizzes

import "net/http"

// ListQuizzes godoc
// @Summary List quizzes
// @Description List quizzes with filters and pagination.
// @Tags quizzes
// @Produce json
// @Param scope query string false "published|not_published|archived" default(published)
// @Param title query string false "Filter by title"
// @Param owner_id query int false "Filter by owner id"
// @Param submitted_only query bool false "Only quizzes the user submitted"
// @Param sort query string false "Sort by category name (use 'category')"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} QuizListResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes [get]
func (h *Handler) ListQuizzes(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	scope := r.URL.Query().Get("scope")
	if scope == "" {
		scope = "published"
	}

	if scope != "published" && scope != "not_published" && scope != "archived" {
		writeError(w, http.StatusBadRequest, "invalid_query", "scope must be one of: published, not_published, archived")
		return
	}

	if !claims.IsAdmin && scope != "published" {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can list unpublished or archived quizzes")
		return
	}

	title := r.URL.Query().Get("title")
	ownerID, err := parseQueryInt32(r, "owner_id", 0)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid owner_id")
		return
	}
	if ownerID < 0 {
		writeError(w, http.StatusBadRequest, "invalid_query", "owner_id must be non-negative")
		return
	}
	submittedOnly, err := parseQueryBool(r, "submitted_only", false)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid submitted_only")
		return
	}
	submittedBy := claims.ID
	sortVal := r.URL.Query().Get("sort")

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
		writeError(w, http.StatusBadRequest, "invalid_query", "offset must be non-negative")
		return
	}

	rows, loadErr := h.loadQuizzes(r.Context(), scope, title, ownerID, submittedOnly, submittedBy, sortVal, limit, offset)
	if loadErr != nil {
		writeError(w, http.StatusInternalServerError, "list_quizzes_failed", "failed to list quizzes")
		return
	}

	writeJSON(w, http.StatusOK, QuizListResponse{
		Quizzes: rows,
		Limit:   limit,
		Offset:  offset,
	})
}
