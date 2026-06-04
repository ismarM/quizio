package httpapi

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/ismarM/quizio/docs"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/ismarM/quizio/internal/httpapi/attempts"
	"github.com/ismarM/quizio/internal/httpapi/questions"
	"github.com/ismarM/quizio/internal/httpapi/quizzes"
	"github.com/ismarM/quizio/internal/httpapi/shared"
	"github.com/ismarM/quizio/internal/httpapi/users"
	httpSwagger "github.com/swaggo/http-swagger/v2"
)

func NewRouter(db *sql.DB, hmacSecret string) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(IntegrityMiddleware(hmacSecret))

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	deps := shared.Deps{
		DB:      db,
		Queries: sqlc.New(db),
	}
	userAPI := users.New(deps)
	quizAPI := quizzes.New(deps)
	questionAPI := questions.New(deps)
	attemptAPI := attempts.New(deps)

	quizAPI.StartLeaderboard(context.Background())

	// Register leaderboard stream endpoint outside the 15s timeout
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware)
		r.Mount("/api/quizzes/{quizId}/leaderboard", quizAPI.StreamRoutes())
	})

	// Register all other API endpoints with the 15s timeout
	r.Group(func(r chi.Router) {
		r.Use(middleware.Timeout(15 * time.Second))

		r.Route("/api", func(r chi.Router) {
			r.Use(AuthMiddleware)

			r.Mount("/users", userAPI.Routes())
			r.Mount("/categories", quizAPI.CategoryRoutes())
			r.Mount("/quizzes/{quizId}/attempts", attemptAPI.Routes())
			r.Mount("/quizzes/{quizId}/attempt", attemptAPI.UserRoutes())
			r.Mount("/quizzes/{quizId}/questions", questionAPI.QuizRoutes())
			r.Mount("/quizzes", quizAPI.Routes())
			r.Mount("/questions", questionAPI.Routes())
		})
	})

	return r
}
