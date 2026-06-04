package questions

import "github.com/go-chi/chi/v5"

// Routes returns question routes mounted at /api/questions.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Put("/{questionId}", h.UpdateQuestion)
	r.Delete("/{questionId}", h.DeleteQuestion)
	return r
}

// QuizRoutes returns quiz-nested question routes mounted at /api/quizzes/{quizId}/questions.
func (h *Handler) QuizRoutes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.CreateQuestion)
	return r
}
