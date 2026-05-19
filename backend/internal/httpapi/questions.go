package httpapi

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// CreateQuestion godoc
// @Summary Create question
// @Description Create a question for a quiz that is not published.
// @Tags questions
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body CreateQuestionRequest true "Create question"
// @Success 201 {object} QuestionDTO
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/questions [post]
func (api *API) CreateQuestion(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	var req CreateQuestionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	state, err := api.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.IsArchived || state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "title is required")
		return
	}
	if len(req.Answers) == 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "answers are required")
		return
	}

	ctx := r.Context()
	tx, err := api.db.BeginTx(ctx, nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "tx_failed", "failed to start transaction")
		return
	}
	defer func() {
		_ = tx.Rollback()
	}()

	qtx := api.queries.WithTx(tx)
	questionRow, err := qtx.CreateQuestion(ctx, sqlc.CreateQuestionParams{
		Title:  req.Title,
		Value:  req.Value,
		TkQuiz: quizID,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "create_question_failed", "failed to create question")
		return
	}

	answers := make([]AnswerDTO, 0, len(req.Answers))
	for _, answer := range req.Answers {
		if answer.Title == "" {
			writeError(w, http.StatusBadRequest, "invalid_payload", "answer title is required")
			return
		}
		answerRow, err := qtx.CreateAnswer(ctx, sqlc.CreateAnswerParams{
			Title:      answer.Title,
			TkQuestion: questionRow.IDQuestion,
			IsCorrect:  answer.IsCorrect,
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, "create_answer_failed", "failed to create answer")
			return
		}
		answers = append(answers, AnswerDTO{
			ID:        answerRow.IDAnswer,
			Title:     answerRow.Title,
			IsCorrect: answerRow.IsCorrect,
		})
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "commit_failed", "failed to commit question")
		return
	}

	writeJSON(w, http.StatusCreated, QuestionDTO{
		ID:      questionRow.IDQuestion,
		Title:   questionRow.Title,
		Value:   questionRow.Value,
		QuizID:  questionRow.TkQuiz,
		Answers: answers,
	})
}

// UpdateQuestion godoc
// @Summary Update question
// @Description Update a question and optionally its answers (quiz not published).
// @Tags questions
// @Accept json
// @Produce json
// @Param questionId path int true "Question ID"
// @Param request body UpdateQuestionRequest true "Update question"
// @Success 200 {object} QuestionDTO
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/questions/{questionId} [put]
func (api *API) UpdateQuestion(w http.ResponseWriter, r *http.Request) {
	questionID, err := parseIDParam(r, "questionId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_question_id", "question id is required")
		return
	}

	var req UpdateQuestionRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	quizID, err := api.queries.GetQuestionQuizID(r.Context(), questionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "question not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_question_failed", "failed to load question")
		return
	}

	state, err := api.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.IsArchived || state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "title is required")
		return
	}

	ctx := r.Context()
	tx, err := api.db.BeginTx(ctx, nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "tx_failed", "failed to start transaction")
		return
	}
	defer func() {
		_ = tx.Rollback()
	}()

	qtx := api.queries.WithTx(tx)
	questionRow, err := qtx.UpdateQuestion(ctx, sqlc.UpdateQuestionParams{
		IDQuestion: questionID,
		Title:      req.Title,
		Value:      req.Value,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update_question_failed", "failed to update question")
		return
	}

	answers := make([]AnswerDTO, 0)
	if len(req.Answers) > 0 {
		if err := qtx.DeleteAnswersByQuestion(ctx, questionID); err != nil {
			writeError(w, http.StatusInternalServerError, "delete_answers_failed", "failed to update answers")
			return
		}
		for _, answer := range req.Answers {
			if answer.Title == "" {
				writeError(w, http.StatusBadRequest, "invalid_payload", "answer title is required")
				return
			}
			answerRow, err := qtx.CreateAnswer(ctx, sqlc.CreateAnswerParams{
				Title:      answer.Title,
				TkQuestion: questionID,
				IsCorrect:  answer.IsCorrect,
			})
			if err != nil {
				writeError(w, http.StatusInternalServerError, "create_answer_failed", "failed to create answer")
				return
			}
			answers = append(answers, AnswerDTO{
				ID:        answerRow.IDAnswer,
				Title:     answerRow.Title,
				IsCorrect: answerRow.IsCorrect,
			})
		}
	} else {
		answerRows, err := qtx.ListAnswersByQuestion(ctx, questionID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "load_answers_failed", "failed to load answers")
			return
		}
		answers = make([]AnswerDTO, 0, len(answerRows))
		for _, answer := range answerRows {
			answers = append(answers, AnswerDTO{
				ID:        answer.IDAnswer,
				Title:     answer.Title,
				IsCorrect: answer.IsCorrect,
			})
		}
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "commit_failed", "failed to commit question")
		return
	}

	writeJSON(w, http.StatusOK, QuestionDTO{
		ID:      questionRow.IDQuestion,
		Title:   questionRow.Title,
		Value:   questionRow.Value,
		QuizID:  questionRow.TkQuiz,
		Answers: answers,
	})
}

// DeleteQuestion godoc
// @Summary Delete question
// @Description Delete a question (quiz not published).
// @Tags questions
// @Produce json
// @Param questionId path int true "Question ID"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/questions/{questionId} [delete]
func (api *API) DeleteQuestion(w http.ResponseWriter, r *http.Request) {
	questionID, err := parseIDParam(r, "questionId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_question_id", "question id is required")
		return
	}

	quizID, err := api.queries.GetQuestionQuizID(r.Context(), questionID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "question not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_question_failed", "failed to load question")
		return
	}

	state, err := api.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.IsArchived || state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	if err := api.queries.DeleteQuestion(r.Context(), questionID); err != nil {
		writeError(w, http.StatusInternalServerError, "delete_question_failed", "failed to delete question")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}
