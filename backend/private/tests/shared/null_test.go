package shared_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestNullStringPtr(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		if got := shared.NullStringPtr(sql.NullString{}); got != nil {
			t.Fatalf("NullStringPtr() = %v, want nil", *got)
		}
	})

	t.Run("valid returns pointer", func(t *testing.T) {
		got := shared.NullStringPtr(sql.NullString{String: "quiz", Valid: true})
		if got == nil || *got != "quiz" {
			t.Fatalf("NullStringPtr() = %v, want quiz", got)
		}
	})
}

func TestNullTimeStringToSeconds(t *testing.T) {
	tests := []struct {
		name  string
		value sql.NullString
		want  *int32
	}{
		{
			name:  "invalid returns nil",
			value: sql.NullString{},
			want:  nil,
		},
		{
			name:  "whole seconds",
			value: sql.NullString{String: "01:02:03", Valid: true},
			want:  int32Ptr(3723),
		},
		{
			name:  "fractional seconds",
			value: sql.NullString{String: "00:10:05.123456", Valid: true},
			want:  int32Ptr(605),
		},
		{
			name:  "invalid format returns nil",
			value: sql.NullString{String: "not-a-time", Valid: true},
			want:  nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := shared.NullTimeStringToSeconds(tt.value)
			assertInt32Ptr(t, got, tt.want)
		})
	}
}

func TestNullTimeToSeconds(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		got := shared.NullTimeToSeconds(sql.NullTime{})
		assertInt32Ptr(t, got, nil)
	})

	t.Run("valid returns seconds", func(t *testing.T) {
		got := shared.NullTimeToSeconds(sql.NullTime{
			Time:  time.Date(2026, 6, 8, 2, 3, 4, 0, time.UTC),
			Valid: true,
		})

		assertInt32Ptr(t, got, int32Ptr(7384))
	})
}

func TestNullTimePtr(t *testing.T) {
	now := time.Date(2026, 6, 8, 12, 0, 0, 0, time.UTC)

	t.Run("invalid returns nil", func(t *testing.T) {
		if got := shared.NullTimePtr(sql.NullTime{}); got != nil {
			t.Fatalf("NullTimePtr() = %v, want nil", got)
		}
	})

	t.Run("valid returns pointer", func(t *testing.T) {
		got := shared.NullTimePtr(sql.NullTime{Time: now, Valid: true})
		if got == nil || !got.Equal(now) {
			t.Fatalf("NullTimePtr() = %v, want %v", got, now)
		}
	})
}

func TestNullInt32Ptr(t *testing.T) {
	t.Run("invalid returns nil", func(t *testing.T) {
		if got := shared.NullInt32Ptr(sql.NullInt32{}); got != nil {
			t.Fatalf("NullInt32Ptr() = %v, want nil", got)
		}
	})

	t.Run("valid returns pointer", func(t *testing.T) {
		got := shared.NullInt32Ptr(sql.NullInt32{Int32: 3, Valid: true})
		if got == nil || *got != 3 {
			t.Fatalf("NullInt32Ptr() = %v, want 3", got)
		}
	})
}

func TestToNullInt32(t *testing.T) {
	t.Run("nil pointer", func(t *testing.T) {
		got := shared.ToNullInt32(nil)
		if got.Valid {
			t.Fatalf("ToNullInt32(nil).Valid = true, want false")
		}
	})

	t.Run("value pointer", func(t *testing.T) {
		value := int32(42)
		got := shared.ToNullInt32(&value)
		if !got.Valid || got.Int32 != value {
			t.Fatalf("ToNullInt32() = %+v, want valid 42", got)
		}
	})
}

func TestToNullString(t *testing.T) {
	t.Run("nil pointer", func(t *testing.T) {
		got := shared.ToNullString(nil)
		if got.Valid {
			t.Fatalf("ToNullString(nil).Valid = true, want false")
		}
	})

	t.Run("value pointer", func(t *testing.T) {
		value := "quiz"
		got := shared.ToNullString(&value)
		if !got.Valid || got.String != value {
			t.Fatalf("ToNullString() = %+v, want valid quiz", got)
		}
	})
}

func TestInt32Ptr(t *testing.T) {
	got := shared.Int32Ptr(9)
	if got == nil || *got != 9 {
		t.Fatalf("Int32Ptr() = %v, want 9", got)
	}
}

func assertInt32Ptr(t *testing.T, got, want *int32) {
	t.Helper()

	if got == nil || want == nil {
		if got != want {
			t.Fatalf("got %v, want %v", got, want)
		}
		return
	}

	if *got != *want {
		t.Fatalf("got %d, want %d", *got, *want)
	}
}

func int32Ptr(value int32) *int32 {
	return &value
}
