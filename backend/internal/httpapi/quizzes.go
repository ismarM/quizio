package httpapi

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"sort"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// CreateQuiz godoc
// @Summary Create quiz
// @Description Create a quiz with questions and answers.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param request body CreateQuizRequest true "Create quiz request"
// @Success 201 {object} QuizFullResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes [post]
func (api *API) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can create quizzes")
		return
	}

	var req CreateQuizRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "title is required")
		return
	}
	if req.TimeLimitSeconds <= 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "time_limit_seconds must be positive")
		return
	}
	if len(req.Questions) == 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "questions are required")
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
	quizRow, err := qtx.CreateQuiz(ctx, sqlc.CreateQuizParams{
		Title:       req.Title,
		Secs:        float64(req.TimeLimitSeconds),
		Description: toNullString(req.Description),
		TkUser:      claims.ID,
		TkCategory:  toNullInt32(req.CategoryID),
		ImageUrl:    toNullString(req.ImageURL),
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "quiz_exists", "quiz title already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "create_quiz_failed", "failed to create quiz")
		return
	}

	questions := make([]QuestionDTO, 0, len(req.Questions))
	for _, question := range req.Questions {
		if question.Title == "" {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question title is required")
			return
		}
		if len(question.Answers) == 0 {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question answers are required")
			return
		}
		questionRow, err := qtx.CreateQuestion(ctx, sqlc.CreateQuestionParams{
			Title:  question.Title,
			Value:  question.Value,
			TkQuiz: quizRow.IDQuiz,
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, "create_question_failed", "failed to create question")
			return
		}

		answers := make([]AnswerDTO, 0, len(question.Answers))
		for _, answer := range question.Answers {
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

		questions = append(questions, QuestionDTO{
			ID:      questionRow.IDQuestion,
			Title:   questionRow.Title,
			Value:   questionRow.Value,
			QuizID:  questionRow.TkQuiz,
			Answers: answers,
		})
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "commit_failed", "failed to commit quiz")
		return
	}

	quizDTO := QuizDTO{
		ID:               quizRow.IDQuiz,
		Title:            quizRow.Title,
		Description:      nullStringPtr(quizRow.Description),
		CreatedAt:        quizRow.CreatedAt,
		PublishDate:      nullTimePtr(quizRow.PublishDate),
		OwnerID:          quizRow.TkUser,
		IsArchived:       quizRow.IsArchived,
		TimeLimitSeconds: quizRow.TimeLimitSeconds,
		QuestionCount:    int32Ptr(int32(len(questions))),
		CategoryID:       nullInt32Ptr(quizRow.TkCategory),
		ImageURL:         nullStringPtr(quizRow.ImageUrl),
	}

	writeJSON(w, http.StatusCreated, QuizFullResponse{
		Quiz:      quizDTO,
		Questions: questions,
	})
}

// UpdateQuiz godoc
// @Summary Update quiz
// @Description Update quiz metadata (only when not published).
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body UpdateQuizRequest true "Update quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [put]
func (api *API) UpdateQuiz(w http.ResponseWriter, r *http.Request) {
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
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can update quizzes")
		return
	}

	var req UpdateQuizRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "title is required")
		return
	}
	if req.TimeLimitSeconds <= 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "time_limit_seconds must be positive")
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
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can update it")
		return
	}
	if state.IsArchived || state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	updated, err := api.queries.UpdateQuiz(r.Context(), sqlc.UpdateQuizParams{
		IDQuiz:      quizID,
		Title:       req.Title,
		Description: toNullString(req.Description),
		Secs:        float64(req.TimeLimitSeconds),
		TkCategory:  toNullInt32(req.CategoryID),
		ImageUrl:    toNullString(req.ImageURL),
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "quiz_exists", "quiz title already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "update_quiz_failed", "failed to update quiz")
		return
	}

	quizDTO := quizFromUpdateRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// GetQuizInfo godoc
// @Summary Get quiz info
// @Description Get quiz info for published quizzes.
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/info [get]
func (api *API) GetQuizInfo(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	row, err := api.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	if row.IsArchived || !row.PublishDate.Valid || row.PublishDate.Time.After(time.Now()) {
		writeError(w, http.StatusNotFound, "not_found", "quiz not found")
		return
	}

	quizDTO := quizFromQuizRow(row, row.QuestionCount)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// GetFullQuiz godoc
// @Summary Get full quiz
// @Description Get the full quiz definition (only for admin/owner).
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} QuizFullResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [get]
func (api *API) GetFullQuiz(w http.ResponseWriter, r *http.Request) {
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

	quizRow, err := api.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	if !claims.IsAdmin || quizRow.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can view the full quiz details")
		return
	}

	questions, err := api.loadQuizQuestions(r.Context(), quizID, true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "load_questions_failed", "failed to load quiz questions")
		return
	}

	quizDTO := quizFromQuizRow(quizRow, int32(len(questions)))
	writeJSON(w, http.StatusOK, QuizFullResponse{Quiz: quizDTO, Questions: questions})
}

// PublishQuiz godoc
// @Summary Publish quiz
// @Description Publish a quiz immediately or schedule a publish date.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body PublishQuizRequest true "Publish quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/publish [patch]
func (api *API) PublishQuiz(w http.ResponseWriter, r *http.Request) {
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
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can publish quizzes")
		return
	}

	var req PublishQuizRequest
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
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can publish it")
		return
	}
	if state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	publishTime := time.Now()
	if req.PublishDate != nil {
		publishTime = *req.PublishDate
	}

	updated, err := api.queries.SetQuizPublishDate(r.Context(), sqlc.SetQuizPublishDateParams{
		IDQuiz:      quizID,
		PublishDate: sql.NullTime{Time: publishTime, Valid: true},
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "publish_quiz_failed", "failed to publish quiz")
		return
	}

	quizDTO := quizFromPublishRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// ArchiveQuiz godoc
// @Summary Archive quiz
// @Description Archive or unarchive a quiz.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body ArchiveQuizRequest true "Archive quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/archive [patch]
func (api *API) ArchiveQuiz(w http.ResponseWriter, r *http.Request) {
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
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can archive quizzes")
		return
	}

	var req ArchiveQuizRequest
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
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can archive it")
		return
	}

	updated, err := api.queries.ArchiveQuiz(r.Context(), sqlc.ArchiveQuizParams{
		IDQuiz:     quizID,
		IsArchived: req.IsArchived,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "archive_quiz_failed", "failed to archive quiz")
		return
	}

	quizDTO := quizFromArchiveRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// DeleteQuiz godoc
// @Summary Delete quiz
// @Description Delete a quiz and all related data.
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [delete]
func (api *API) DeleteQuiz(w http.ResponseWriter, r *http.Request) {
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
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can delete quizzes")
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
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can delete it")
		return
	}

	if err := api.queries.DeleteQuiz(r.Context(), quizID); err != nil {
		writeError(w, http.StatusInternalServerError, "delete_quiz_failed", "failed to delete quiz")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}

// ListQuizzes godoc
// @Summary List quizzes
// @Description List quizzes with filters and pagination.
// @Tags quizzes
// @Produce json
// @Param scope query string false "published|not_published|archived" default(published)
// @Param title query string false "Filter by title"
// @Param owner_id query int false "Filter by owner id"
// @Param submitted_only query bool false "Only quizzes the user submitted"
// @Param sort query string false "Sort by category name (use 'category')"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} QuizListResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes [get]
func (api *API) ListQuizzes(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	scope := r.URL.Query().Get("scope")
	if scope == "" {
		scope = "published"
	}

	if scope != "published" && scope != "not_published" && scope != "archived" {
		writeError(w, http.StatusBadRequest, "invalid_query", "scope must be one of: published, not_published, archived")
		return
	}

	if !claims.IsAdmin && scope != "published" {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can list unpublished or archived quizzes")
		return
	}

	title := r.URL.Query().Get("title")
	ownerID, err := parseQueryInt32(r, "owner_id", 0)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid owner_id")
		return
	}
	if ownerID < 0 {
		writeError(w, http.StatusBadRequest, "invalid_query", "owner_id must be non-negative")
		return
	}
	submittedOnly, err := parseQueryBool(r, "submitted_only", false)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid submitted_only")
		return
	}
	var submittedBy int32
	if submittedOnly {
		submittedBy = claims.ID
	}
	sortVal := r.URL.Query().Get("sort")

	limit, err := parseQueryInt32(r, "limit", defaultLimit)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid limit")
		return
	}
	offset, err := parseQueryInt32(r, "offset", 0)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid offset")
		return
	}
	limit = normalizeLimit(limit)
	if offset < 0 {
		writeError(w, http.StatusBadRequest, "invalid_query", "offset must be non-negative")
		return
	}

	rows, loadErr := api.loadQuizzes(r.Context(), scope, title, ownerID, submittedOnly, submittedBy, sortVal, limit, offset)
	if loadErr != nil {
		writeError(w, http.StatusInternalServerError, "list_quizzes_failed", "failed to list quizzes")
		return
	}

	writeJSON(w, http.StatusOK, QuizListResponse{
		Quizzes: rows,
		Limit:   limit,
		Offset:  offset,
	})
}

func (api *API) loadQuizzes(ctx context.Context, scope, title string, ownerID int32, submittedOnly bool, submittedBy int32, sortBy string, limit, offset int32) ([]QuizDTO, error) {
	rows, err := api.queries.ListQuizzes(ctx, sqlc.ListQuizzesParams{
		Column1: scope,
		Column2: title,
		Column3: ownerID,
		Column4: submittedOnly,
		TkUser:  submittedBy,
		Column6: sortBy,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, err
	}
	results := make([]QuizDTO, 0, len(rows))
	for _, row := range rows {
		results = append(results, quizFromListRow(
			row.IDQuiz,
			row.Title,
			row.Description,
			row.CreatedAt,
			row.PublishDate,
			row.TkUser,
			row.IsArchived,
			row.TimeLimitSeconds,
			row.QuestionCount,
			row.TkCategory,
			row.ImageUrl,
			row.CategoryName,
		))
	}
	return results, nil
}

func quizFromQuizRow(row sqlc.GetQuizByIDRow, questionCount int32) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		QuestionCount:    int32Ptr(questionCount),
		CategoryID:       nullInt32Ptr(row.TkCategory),
		ImageURL:         nullStringPtr(row.ImageUrl),
		CategoryName:     nullStringPtr(row.CategoryName),
	}
}

func quizFromUpdateRow(row sqlc.UpdateQuizRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		CategoryID:       nullInt32Ptr(row.TkCategory),
		ImageURL:         nullStringPtr(row.ImageUrl),
	}
}

func quizFromPublishRow(row sqlc.SetQuizPublishDateRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		CategoryID:       nullInt32Ptr(row.TkCategory),
		ImageURL:         nullStringPtr(row.ImageUrl),
	}
}

func quizFromArchiveRow(row sqlc.ArchiveQuizRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		CategoryID:       nullInt32Ptr(row.TkCategory),
		ImageURL:         nullStringPtr(row.ImageUrl),
	}
}

func quizFromListRow(id int32, title string, description sql.NullString, createdAt time.Time, publishDate sql.NullTime, ownerID int32, isArchived bool, timeLimitSeconds int32, questionCount int32, categoryID sql.NullInt32, imageURL sql.NullString, categoryName sql.NullString) QuizDTO {
	count := questionCount
	return QuizDTO{
		ID:               id,
		Title:            title,
		Description:      nullStringPtr(description),
		CreatedAt:        createdAt,
		PublishDate:      nullTimePtr(publishDate),
		OwnerID:          ownerID,
		IsArchived:       isArchived,
		TimeLimitSeconds: timeLimitSeconds,
		QuestionCount:    int32Ptr(count),
		CategoryID:       nullInt32Ptr(categoryID),
		ImageURL:         nullStringPtr(imageURL),
		CategoryName:     nullStringPtr(categoryName),
	}
}

func int32Ptr(value int32) *int32 {
	return &value
}

// ListCategories godoc
// @Summary Fetch all categories
// @Description Fetch all available quiz categories.
// @Tags categories
// @Produce json
// @Success 200 {object} CategoryListResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/categories [get]
func (api *API) ListCategories(w http.ResponseWriter, r *http.Request) {
	_, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	rows, err := api.queries.ListCategories(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list_categories_failed", "failed to fetch categories")
		return
	}

	categories := make([]CategoryDTO, 0, len(rows))
	for _, row := range rows {
		categories = append(categories, CategoryDTO{
			ID:   row.IDCategory,
			Name: row.Name,
		})
	}

	writeJSON(w, http.StatusOK, CategoryListResponse{Categories: categories})
}

// GetQuizLeaderboard godoc
// @Summary Get leaderboard for a quiz
// @Description Get the top performances of users for a quiz (admin only).
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} LeaderboardResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/leaderboard [get]
func (api *API) GetQuizLeaderboard(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can view the leaderboard")
		return
	}

	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	_, err = api.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	questions, err := api.loadQuizQuestions(r.Context(), quizID, true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "load_questions_failed", "failed to load quiz questions")
		return
	}

	questionValue := make(map[int32]float64, len(questions))
	answerIsCorrect := make(map[int32]bool)
	var maxPoints float64
	for _, q := range questions {
		questionValue[q.ID] = q.Value
		maxPoints += q.Value
		for _, a := range q.Answers {
			answerIsCorrect[a.ID] = a.IsCorrect
		}
	}

	attempts, err := api.queries.ListFinishedAttemptsByQuiz(r.Context(), quizID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list_attempts_failed", "failed to load attempts")
		return
	}

	entries := make([]LeaderboardEntryDTO, 0, len(attempts))
	for _, att := range attempts {
		responses, err := api.queries.ListAttemptQuestions(r.Context(), att.IDAttempt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "list_responses_failed", "failed to load attempt responses")
			return
		}

		var achieved float64
		for _, resp := range responses {
			if correct, ok := answerIsCorrect[resp.TkAnswer]; ok && correct {
				if val, ok := questionValue[resp.TkQuestion]; ok {
					achieved += val
				}
			}
		}

		var timeTakenSecs *int32
		if att.TimeTaken.Valid {
			timeTakenSecs = nullTimeStringToSeconds(att.TimeTaken)
		}

		var displayName *string
		if att.UserDisplayName.Valid {
			displayName = &att.UserDisplayName.String
		}

		entries = append(entries, LeaderboardEntryDTO{
			UserID:           att.TkUser,
			Email:            att.UserEmail,
			DisplayName:      displayName,
			AchievedPoints:   achieved,
			MaxPoints:        maxPoints,
			TimeTakenSeconds: timeTakenSecs,
		})
	}

	sort.Slice(entries, func(i, j int) bool {
		if entries[i].AchievedPoints != entries[j].AchievedPoints {
			return entries[i].AchievedPoints > entries[j].AchievedPoints
		}
		var ti, tj int32 = 999999, 999999
		if entries[i].TimeTakenSeconds != nil {
			ti = *entries[i].TimeTakenSeconds
		}
		if entries[j].TimeTakenSeconds != nil {
			tj = *entries[j].TimeTakenSeconds
		}
		return ti < tj
	})

	writeJSON(w, http.StatusOK, LeaderboardResponse{
		QuizID:  quizID,
		Entries: entries,
	})
}
