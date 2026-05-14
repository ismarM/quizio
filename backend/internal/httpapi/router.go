package httpapi

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func NewRouter(db *sql.DB) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(15 * time.Second))

	usersHandler := UsersHandler{DB: db}

	r.Route("/api", func(r chi.Router) {
		r.Get("/users", usersHandler.List)
		r.Post("/users", usersHandler.Create)
	})

	return r
}
