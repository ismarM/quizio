package httpapi

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/ismarM/quizio/docs"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

func NewRouter(db *sql.DB) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(15 * time.Second))

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	api := NewAPI(db)

	r.Route("/api", func(r chi.Router) {
		r.Use(AuthMiddleware)

		r.Route("/users", func(r chi.Router) {
			r.Post("/", api.CreateUser)
			r.Get("/lookup", api.GetUserByEmail)
			r.Get("/me", api.GetUserInfo)
			r.Patch("/me/display-name", api.UpdateDisplayName)
			r.Patch("/me/role", api.UpdateRole)
			r.Patch("/me/preferences", api.UpdatePreferences)
			r.Delete("/me", api.DeleteUser)
			r.Get("/me/open-sessions", api.GetOpenSessions)
			r.Get("/me/submissions", api.GetSubmissions)
		})

		r.Route("/quizzes", func(r chi.Router) {
			r.Post("/", api.CreateQuiz)
			r.Get("/", api.ListQuizzes)
			r.Get("/{quizId}", api.GetFullQuiz)
			r.Get("/{quizId}/info", api.GetQuizInfo)
			r.Put("/{quizId}", api.UpdateQuiz)
			r.Patch("/{quizId}/publish", api.PublishQuiz)
			r.Patch("/{quizId}/archive", api.ArchiveQuiz)
			r.Delete("/{quizId}", api.DeleteQuiz)
			r.Post("/{quizId}/questions", api.CreateQuestion)

			// Attempts nested routes under quizzes
			r.Post("/{quizId}/attempts", api.StartAttempt)
			r.Patch("/{quizId}/attempts", api.UpdateAttemptStatus)
			r.Get("/{quizId}/attempts", api.GetAttemptStatus)
			r.Post("/{quizId}/attempts/finish", api.FinishAttempt)
		})

		r.Route("/questions", func(r chi.Router) {
			r.Put("/{questionId}", api.UpdateQuestion)
			r.Delete("/{questionId}", api.DeleteQuestion)
		})
	})

	return r
}
