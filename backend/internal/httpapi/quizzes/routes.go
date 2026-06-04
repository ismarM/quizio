package quizzes

import "github.com/go-chi/chi/v5"

// Routes returns quiz routes mounted at /api/quizzes.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.CreateQuiz)
	r.Get("/", h.ListQuizzes)
	r.Get("/{quizId}", h.GetFullQuiz)
	r.Get("/{quizId}/info", h.GetQuizInfo)
	r.Put("/{quizId}", h.UpdateQuiz)
	r.Patch("/{quizId}/publish", h.PublishQuiz)
	r.Patch("/{quizId}/archive", h.ArchiveQuiz)
	r.Delete("/{quizId}", h.DeleteQuiz)
	r.Get("/{quizId}/leaderboard", h.GetQuizLeaderboard)
	return r
}

// CategoryRoutes returns category routes mounted at /api/categories.
func (h *Handler) CategoryRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.ListCategories)
	return r
}

// StreamRoutes returns SSE routes mounted at /api/quizzes/{quizId}/leaderboard.
func (h *Handler) StreamRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/stream", h.StreamLeaderboard)
	return r
}
