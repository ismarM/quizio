package users

import "github.com/go-chi/chi/v5"

// Routes returns the user routes mounted at /api/users.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.CreateUser)
	r.Get("/lookup", h.GetUserByEmail)
	r.Get("/me", h.GetUserInfo)
	r.Patch("/me/display-name", h.UpdateDisplayName)
	r.Patch("/me/preferences", h.UpdatePreferences)
	r.Patch("/{userId}/role", h.UpdateRole)
	r.Delete("/me", h.DeleteUser)
	r.Get("/me/open-sessions", h.GetOpenSessions)
	r.Get("/me/submissions", h.GetSubmissions)
	return r
}
