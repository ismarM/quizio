package shared_test

import (
	"context"
	"testing"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestUserContext(t *testing.T) {
	if _, ok := shared.UserFromContext(context.Background()); ok {
		t.Fatalf("UserFromContext(empty) ok = true, want false")
	}

	claims := shared.UserClaims{
		ID:      12,
		Email:   "admin@example.com",
		IsAdmin: true,
	}

	got, ok := shared.UserFromContext(shared.WithUser(context.Background(), claims))
	if !ok {
		t.Fatalf("UserFromContext() ok = false, want true")
	}
	if got != claims {
		t.Fatalf("UserFromContext() = %+v, want %+v", got, claims)
	}
}
