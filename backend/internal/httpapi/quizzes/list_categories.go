package quizzes

import "net/http"

// ListCategories godoc
// @Summary Fetch all categories
// @Description Fetch all available quiz categories.
// @Tags categories
// @Produce json
// @Success 200 {object} CategoryListResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/categories [get]
func (h *Handler) ListCategories(w http.ResponseWriter, r *http.Request) {
	_, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	rows, err := h.queries.ListCategories(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list_categories_failed", "failed to fetch categories")
		return
	}

	categories := make([]CategoryDTO, 0, len(rows))
	for _, row := range rows {
		categories = append(categories, CategoryDTO{
			ID:   row.IDCategory,
			Name: row.Name,
		})
	}

	writeJSON(w, http.StatusOK, CategoryListResponse{Categories: categories})
}
