package attempts

import (
	"database/sql"
	"errors"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
	"time"
)

// UpdateAttemptStatus godoc
// @Summary Update attempt status
// @Description Update answers during an attempt (only while active).
// @Tags attempts
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body UpdateAttemptRequest true "Update attempt"
// @Success 200 {object} AttemptResultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/attempts [patch]
func (h *Handler) UpdateAttemptStatus(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	var req UpdateAttemptRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	row, err := h.queries.GetAttemptWithQuiz(r.Context(), sqlc.GetAttemptWithQuizParams{
		TkQuiz: quizID,
		TkUser: userID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "attempt not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_attempt_failed", "failed to load attempt")
		return
	}

	if row.TimeTaken.Valid {
		writeError(w, http.StatusConflict, "attempt_finished", "attempt already finished")
		return
	}

	endTime := row.StartTime.Add(time.Duration(row.TimeLimitSeconds) * time.Second)
	if time.Now().After(endTime) || !row.IsActive {
		_, _ = h.queries.FinalizeAttemptIfExpired(r.Context(), row.IDAttempt)
		writeError(w, http.StatusConflict, "attempt_expired", "attempt time limit has passed")
		return
	}

	questionQuizIDs := make(map[int32]int32)
	answerIDsByQuestion := make(map[int32]map[int32]struct{})
	for _, update := range req.Updates {
		if update.QuestionID <= 0 || update.AnswerID <= 0 {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question_id and answer_id are required")
			return
		}
		questionQuizID, ok := questionQuizIDs[update.QuestionID]
		if !ok {
			questionQuizID, err = h.queries.GetQuestionQuizID(r.Context(), update.QuestionID)
			if err != nil {
				writeError(w, http.StatusBadRequest, "invalid_payload", "question does not belong to quiz")
				return
			}
			questionQuizIDs[update.QuestionID] = questionQuizID
		}
		if questionQuizID != quizID {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question does not belong to quiz")
			return
		}
		answerIDs, ok := answerIDsByQuestion[update.QuestionID]
		if !ok {
			answerRows, err := h.queries.ListAnswersByQuestion(r.Context(), update.QuestionID)
			if err != nil {
				writeError(w, http.StatusInternalServerError, "load_answers_failed", "failed to load question answers")
				return
			}
			answerIDs = make(map[int32]struct{}, len(answerRows))
			for _, answer := range answerRows {
				answerIDs[answer.IDAnswer] = struct{}{}
			}
			answerIDsByQuestion[update.QuestionID] = answerIDs
		}
		if _, exists := answerIDs[update.AnswerID]; !exists {
			writeError(w, http.StatusBadRequest, "invalid_payload", "answer does not belong to question")
			return
		}
		if err := h.queries.UpsertAttemptQuestion(r.Context(), sqlc.UpsertAttemptQuestionParams{
			TkAttempt:  row.IDAttempt,
			TkQuestion: update.QuestionID,
			TkAnswer:   update.AnswerID,
		}); err != nil {
			writeError(w, http.StatusInternalServerError, "update_attempt_failed", "failed to update attempt")
			return
		}
	}

	attempt := attemptFromRow(row)
	result, err := h.buildAttemptResult(r.Context(), attempt, quizID, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
		return
	}
	writeJSON(w, http.StatusOK, result)
}
