// Izbira: UpdateAttemptStatus združuje validacijo HTTP vhoda, avtorizacijo,
// časovna pravila poskusa, pripadnost vprašanj in odgovorov ter napake baze.
// Pričakovano vedenje se preverja prek javnega handlerja; SQL baza je zamenjana
// z go-sqlmock, zato testi ne potrebujejo omrežja ali prave podatkovne baze.
package shared_test

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/go-chi/chi/v5"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/ismarM/quizio/internal/httpapi/attempts"
	"github.com/ismarM/quizio/internal/httpapi/shared"
)

const validAttemptUpdateBody = `{"updates":[{"question_id":11,"answer_id":21}]}`

func TestUpdateAttemptStatus(t *testing.T) {
	tests := []struct {
		name          string
		quizID        string
		authenticated bool
		body          string
		arrange       func(sqlmock.Sqlmock, time.Time)
		wantStatus    int
		wantError     string
	}{
		{
			name:          "accepts valid active attempt and answer",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), nil, true, 3600)
				expectValidQuestionAndAnswer(mock)
				mock.ExpectExec(`INSERT INTO quizio\."Attempt_Question"`).
					WithArgs(int32(31), int32(11), int32(21)).
					WillReturnResult(sqlmock.NewResult(1, 1))
				expectAttemptResult(mock, now)
			},
			wantStatus: http.StatusOK,
		},
		{
			name:          "rejects missing quiz id",
			authenticated: true,
			body:          validAttemptUpdateBody,
			wantStatus:    http.StatusBadRequest,
			wantError:     "invalid_quiz_id",
		},
		{
			name:          "rejects invalid quiz id",
			quizID:        "abc",
			authenticated: true,
			body:          validAttemptUpdateBody,
			wantStatus:    http.StatusBadRequest,
			wantError:     "invalid_quiz_id",
		},
		{
			name:       "rejects unauthenticated user",
			quizID:     "7",
			body:       validAttemptUpdateBody,
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:          "rejects invalid JSON",
			quizID:        "7",
			authenticated: true,
			body:          `{"updates":`,
			wantStatus:    http.StatusBadRequest,
			wantError:     "invalid_payload",
		},
		{
			name:          "returns not found for missing attempt",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, _ time.Time) {
				expectAttemptError(mock, sql.ErrNoRows)
			},
			wantStatus: http.StatusNotFound,
			wantError:  "not_found",
		},
		{
			name:          "rejects finished attempt",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), "00:01:00", true, 3600)
			},
			wantStatus: http.StatusConflict,
			wantError:  "attempt_finished",
		},
		{
			name:          "rejects expired attempt",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-2*time.Hour), nil, false, 60)
				expectFinalizeAttempt(mock)
			},
			wantStatus: http.StatusConflict,
			wantError:  "attempt_expired",
		},
		{
			name:          "rejects inactive attempt",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), nil, false, 3600)
				expectFinalizeAttempt(mock)
			},
			wantStatus: http.StatusConflict,
			wantError:  "attempt_expired",
		},
		{
			name:          "rejects invalid question id",
			quizID:        "7",
			authenticated: true,
			body:          `{"updates":[{"question_id":0,"answer_id":21}]}`,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), nil, true, 3600)
			},
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid_payload",
		},
		{
			name:          "rejects invalid answer id",
			quizID:        "7",
			authenticated: true,
			body:          `{"updates":[{"question_id":11,"answer_id":0}]}`,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), nil, true, 3600)
			},
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid_payload",
		},
		{
			name:          "rejects question from another quiz",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), nil, true, 3600)
				mock.ExpectQuery(`SELECT tk_Quiz`).WithArgs(int32(11)).
					WillReturnRows(sqlmock.NewRows([]string{"tk_quiz"}).AddRow(int32(8)))
			},
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid_payload",
		},
		{
			name:          "rejects answer from another question",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), nil, true, 3600)
				mock.ExpectQuery(`SELECT tk_Quiz`).WithArgs(int32(11)).
					WillReturnRows(sqlmock.NewRows([]string{"tk_quiz"}).AddRow(int32(7)))
				mock.ExpectQuery(`SELECT id_Answer, title, tk_Question, is_correct`).WithArgs(int32(11)).
					WillReturnRows(sqlmock.NewRows([]string{"id_answer", "title", "tk_question", "is_correct"}).
						AddRow(int32(22), "other", int32(11), false))
			},
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid_payload",
		},
		{
			name:          "handles attempt database error",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, _ time.Time) {
				expectAttemptError(mock, errors.New("database unavailable"))
			},
			wantStatus: http.StatusInternalServerError,
			wantError:  "get_attempt_failed",
		},
		{
			name:          "handles answer lookup database error",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), nil, true, 3600)
				mock.ExpectQuery(`SELECT tk_Quiz`).WithArgs(int32(11)).
					WillReturnRows(sqlmock.NewRows([]string{"tk_quiz"}).AddRow(int32(7)))
				mock.ExpectQuery(`SELECT id_Answer, title, tk_Question, is_correct`).WithArgs(int32(11)).
					WillReturnError(errors.New("database unavailable"))
			},
			wantStatus: http.StatusInternalServerError,
			wantError:  "load_answers_failed",
		},
		{
			name:          "handles answer save database error",
			quizID:        "7",
			authenticated: true,
			body:          validAttemptUpdateBody,
			arrange: func(mock sqlmock.Sqlmock, now time.Time) {
				expectAttempt(mock, now.Add(-time.Minute), nil, true, 3600)
				expectValidQuestionAndAnswer(mock)
				mock.ExpectExec(`INSERT INTO quizio\."Attempt_Question"`).
					WithArgs(int32(31), int32(11), int32(21)).
					WillReturnError(errors.New("database unavailable"))
			},
			wantStatus: http.StatusInternalServerError,
			wantError:  "update_attempt_failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("create SQL mock: %v", err)
			}
			t.Cleanup(func() {
				mock.ExpectClose()
				if err := db.Close(); err != nil {
					t.Errorf("close SQL mock: %v", err)
				}
			})

			now := time.Now()
			if tt.arrange != nil {
				tt.arrange(mock, now)
			}
			handler := attempts.New(shared.Deps{DB: db, Queries: sqlc.New(db)})
			req := httptest.NewRequest(http.MethodPatch, "/api/quizzes/"+tt.quizID+"/attempts", strings.NewReader(tt.body))
			routeContext := chi.NewRouteContext()
			if tt.quizID != "" {
				routeContext.URLParams.Add("quizId", tt.quizID)
			}
			ctx := contextWithRoute(req.Context(), routeContext)
			if tt.authenticated {
				ctx = shared.WithUser(ctx, shared.UserClaims{ID: 5})
			}
			req = req.WithContext(ctx)
			recorder := httptest.NewRecorder()

			handler.UpdateAttemptStatus(recorder, req)

			if recorder.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d; body = %s", recorder.Code, tt.wantStatus, recorder.Body.String())
			}
			if tt.wantError != "" {
				var response shared.ErrorResponse
				if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
					t.Fatalf("decode error response: %v", err)
				}
				if response.Error != tt.wantError {
					t.Fatalf("error code = %q, want %q", response.Error, tt.wantError)
				}
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatalf("unexpected database interaction: %v", err)
			}
		})
	}
}

func expectAttempt(mock sqlmock.Sqlmock, start time.Time, timeTaken any, active bool, limitSeconds int32) {
	mock.ExpectQuery(`SELECT a\.id_Attempt,`).WithArgs(int32(7), int32(5)).
		WillReturnRows(sqlmock.NewRows([]string{
			"id_attempt", "start_time", "time_taken", "tk_quiz", "tk_user", "user_name", "is_active", "time_limit_seconds",
		}).AddRow(int32(31), start, timeTaken, int32(7), int32(5), "tester", active, limitSeconds))
}

func expectAttemptError(mock sqlmock.Sqlmock, err error) {
	mock.ExpectQuery(`SELECT a\.id_Attempt,`).WithArgs(int32(7), int32(5)).WillReturnError(err)
}

func expectFinalizeAttempt(mock sqlmock.Sqlmock) {
	mock.ExpectQuery(`UPDATE quizio\."Attempt" a`).WithArgs(int32(31)).WillReturnError(sql.ErrNoRows)
}

func expectValidQuestionAndAnswer(mock sqlmock.Sqlmock) {
	mock.ExpectQuery(`SELECT tk_Quiz`).WithArgs(int32(11)).
		WillReturnRows(sqlmock.NewRows([]string{"tk_quiz"}).AddRow(int32(7)))
	mock.ExpectQuery(`SELECT id_Answer, title, tk_Question, is_correct`).WithArgs(int32(11)).
		WillReturnRows(sqlmock.NewRows([]string{"id_answer", "title", "tk_question", "is_correct"}).
			AddRow(int32(21), "answer", int32(11), true))
}

func expectAttemptResult(mock sqlmock.Sqlmock, now time.Time) {
	mock.ExpectQuery(`SELECT q\.id_Quiz,`).WithArgs(int32(7)).
		WillReturnRows(sqlmock.NewRows([]string{
			"id_quiz", "title", "description", "created_at", "publish_date", "tk_user", "is_archived",
			"tk_category", "image_url", "category_name", "time_limit_seconds", "question_count",
		}).AddRow(int32(7), "Quiz", nil, now, nil, int32(5), false, nil, nil, nil, int32(3600), int32(0)))
	mock.ExpectQuery(`SELECT id_Question, title, value, tk_Quiz`).WithArgs(int32(7)).
		WillReturnRows(sqlmock.NewRows([]string{"id_question", "title", "value", "tk_quiz"}))
	mock.ExpectQuery(`SELECT tk_Attempt, tk_Question, tk_Answer`).WithArgs(int32(31)).
		WillReturnRows(sqlmock.NewRows([]string{"tk_attempt", "tk_question", "tk_answer"}))
}
