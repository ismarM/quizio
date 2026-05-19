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
		r.Route("/users", func(r chi.Router) {
			r.Post("/", api.CreateUser)
			r.Get("/{userId}", api.GetUserInfo)
			r.Patch("/{userId}/display-name", api.UpdateDisplayName)
			r.Patch("/{userId}/role", api.UpdateRole)
			r.Patch("/{userId}/preferences", api.UpdatePreferences)
			r.Delete("/{userId}", api.DeleteUser)
			r.Get("/{userId}/open-sessions", api.GetOpenSessions)
			r.Get("/{userId}/submissions", api.GetSubmissions)
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
		})

		r.Route("/questions", func(r chi.Router) {
			r.Put("/{questionId}", api.UpdateQuestion)
			r.Delete("/{questionId}", api.DeleteQuestion)
		})

		r.Route("/users/{userId}/quizzes/{quizId}", func(r chi.Router) {
			r.Post("/attempts", api.StartAttempt)
			r.Patch("/attempts", api.UpdateAttemptStatus)
			r.Get("/attempts", api.GetAttemptStatus)
			r.Post("/attempts/finish", api.FinishAttempt)
		})

		r.Route("/images", func(r chi.Router) {
			r.Post("/", api.UploadImage)
			r.Delete("/", api.DeleteImage)
		})
	})

	return r
}
