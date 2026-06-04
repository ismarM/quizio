package users

import "github.com/ismarM/quizio/internal/db/sqlc"

func userDTO(user sqlc.QuizioUser) UserDTO {
	return UserDTO{
		ID:             user.IDUser,
		Email:          user.Email,
		IsAdmin:        user.IsAdmin,
		DisplayName:    nullStringPtr(user.Displayname),
		Language:       user.Language,
		Theme:          user.Theme,
		ProfilePicture: nullStringPtr(user.ProfilePicture),
	}
}
