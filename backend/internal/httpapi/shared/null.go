package shared

import (
	"database/sql"
	"time"
)

// NullStringPtr converts sql.NullString to a pointer for JSON DTOs.
func NullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

// NullTimePtr converts sql.NullTime to a pointer for JSON DTOs.
func NullTimePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}
	return &value.Time
}

// NullTimeStringToSeconds converts a Postgres time string into seconds.
func NullTimeStringToSeconds(value sql.NullString) *int32 {
	if !value.Valid {
		return nil
	}
	t, err := time.Parse("15:04:05", value.String)
	if err != nil {
		t, err = time.Parse("15:04:05.999999", value.String)
		if err != nil {
			return nil
		}
	}
	seconds := int32(t.Hour()*3600 + t.Minute()*60 + t.Second())
	return &seconds
}

// NullTimeToSeconds converts sql.NullTime into seconds since midnight.
func NullTimeToSeconds(value sql.NullTime) *int32 {
	if !value.Valid {
		return nil
	}
	seconds := int32(value.Time.Hour()*3600 + value.Time.Minute()*60 + value.Time.Second())
	return &seconds
}

// NullInt32Ptr converts sql.NullInt32 to a pointer for JSON DTOs.
func NullInt32Ptr(value sql.NullInt32) *int32 {
	if !value.Valid {
		return nil
	}
	return &value.Int32
}

// ToNullInt32 converts an int32 pointer to sql.NullInt32.
func ToNullInt32(value *int32) sql.NullInt32 {
	if value == nil {
		return sql.NullInt32{}
	}
	return sql.NullInt32{Int32: *value, Valid: true}
}

// ToNullString converts a string pointer to sql.NullString.
func ToNullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *value, Valid: true}
}

// Int32Ptr returns a pointer to value.
func Int32Ptr(value int32) *int32 {
	return &value
}
