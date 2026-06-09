package shared_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestQuizFromListRowMapsNullableFields(t *testing.T) {
	createdAt := time.Date(2026, 6, 8, 10, 0, 0, 0, time.UTC)
	publishDate := time.Date(2026, 6, 9, 10, 0, 0, 0, time.UTC)

	got := shared.QuizFromListRow(
		1,
		"Final quiz",
		sql.NullString{String: "description", Valid: true},
		createdAt,
		sql.NullTime{Time: publishDate, Valid: true},
		2,
		false,
		600,
		4,
		sql.NullInt32{Int32: 3, Valid: true},
		sql.NullString{String: "https://example.com/image.png", Valid: true},
		sql.NullString{String: "Math", Valid: true},
		true,
	)

	if got.ID != 1 || got.Title != "Final quiz" || got.OwnerID != 2 {
		t.Fatalf("basic quiz fields = %+v, want id/title/owner mapped", got)
	}
	if got.Description == nil || *got.Description != "description" {
		t.Fatalf("Description = %v, want description", got.Description)
	}
	if got.PublishDate == nil || !got.PublishDate.Equal(publishDate) {
		t.Fatalf("PublishDate = %v, want %v", got.PublishDate, publishDate)
	}
	if got.QuestionCount == nil || *got.QuestionCount != 4 {
		t.Fatalf("QuestionCount = %v, want 4", got.QuestionCount)
	}
	if got.CategoryID == nil || *got.CategoryID != 3 {
		t.Fatalf("CategoryID = %v, want 3", got.CategoryID)
	}
	if got.ImageURL == nil || *got.ImageURL != "https://example.com/image.png" {
		t.Fatalf("ImageURL = %v, want image URL", got.ImageURL)
	}
	if got.CategoryName == nil || *got.CategoryName != "Math" {
		t.Fatalf("CategoryName = %v, want Math", got.CategoryName)
	}
	if !got.IsCompleted {
		t.Fatal("IsCompleted = false, want true")
	}
}

func TestQuizFromListRowMapsInvalidNullsToNil(t *testing.T) {
	got := shared.QuizFromListRow(
		1,
		"Draft",
		sql.NullString{},
		time.Date(2026, 6, 8, 10, 0, 0, 0, time.UTC),
		sql.NullTime{},
		2,
		false,
		600,
		0,
		sql.NullInt32{},
		sql.NullString{},
		sql.NullString{},
		false,
	)

	if got.Description != nil {
		t.Fatalf("Description = %v, want nil", got.Description)
	}
	if got.PublishDate != nil {
		t.Fatalf("PublishDate = %v, want nil", got.PublishDate)
	}
	if got.CategoryID != nil {
		t.Fatalf("CategoryID = %v, want nil", got.CategoryID)
	}
	if got.ImageURL != nil {
		t.Fatalf("ImageURL = %v, want nil", got.ImageURL)
	}
	if got.CategoryName != nil {
		t.Fatalf("CategoryName = %v, want nil", got.CategoryName)
	}
}
