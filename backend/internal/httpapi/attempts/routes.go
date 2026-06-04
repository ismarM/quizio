package attempts

import "github.com/go-chi/chi/v5"

// Routes returns attempt routes mounted at /api/quizzes/{quizId}/attempts.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.StartAttempt)
	r.Patch("/", h.UpdateAttemptStatus)
	r.Get("/", h.GetAttemptStatus)
	r.Get("/admin", h.ListQuizAttemptsAdmin)
	r.Post("/finish", h.FinishAttempt)
	return r
}

// UserRoutes returns the legacy singular attempt route mounted at /api/quizzes/{quizId}/attempt.
func (h *Handler) UserRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/{userId}", h.GetAttemptForUser)
	return r
}
