package shared

import "context"

type contextKey string

var userClaimsKey contextKey = "userClaims"

// UserClaims contains the authenticated user information supplied by the BFF.
type UserClaims struct {
	ID      int32
	Email   string
	IsAdmin bool
}

// WithUser stores authenticated user claims in the request context.
func WithUser(ctx context.Context, claims UserClaims) context.Context {
	return context.WithValue(ctx, userClaimsKey, claims)
}

// UserFromContext reads authenticated user claims from the request context.
func UserFromContext(ctx context.Context) (UserClaims, bool) {
	claims, ok := ctx.Value(userClaimsKey).(UserClaims)
	return claims, ok
}
