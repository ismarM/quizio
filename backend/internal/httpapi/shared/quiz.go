package shared

import (
	"context"
	"database/sql"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// LoadQuizQuestions loads quiz questions and answers, optionally hiding correctness.
func LoadQuizQuestions(ctx context.Context, queries *sqlc.Queries, quizID int32, includeCorrect bool) ([]QuestionDTO, error) {
	questionRows, err := queries.ListQuestionsByQuiz(ctx, quizID)
	if err != nil {
		return nil, err
	}

	questions := make([]QuestionDTO, 0, len(questionRows))
	for _, question := range questionRows {
		answersRows, err := queries.ListAnswersByQuestion(ctx, question.IDQuestion)
		if err != nil {
			return nil, err
		}
		answers := make([]AnswerDTO, 0, len(answersRows))
		for _, answer := range answersRows {
			isCorrect := answer.IsCorrect
			if !includeCorrect {
				isCorrect = false
			}
			answers = append(answers, AnswerDTO{
				ID:        answer.IDAnswer,
				Title:     answer.Title,
				IsCorrect: isCorrect,
			})
		}
		questions = append(questions, QuestionDTO{
			ID:      question.IDQuestion,
			Title:   question.Title,
			Value:   question.Value,
			QuizID:  question.TkQuiz,
			Answers: answers,
		})
	}

	return questions, nil
}

// QuizFromQuizRow maps the full quiz query row to the API DTO.
func QuizFromQuizRow(row sqlc.GetQuizByIDRow, questionCount int32) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      NullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      NullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		QuestionCount:    Int32Ptr(questionCount),
		CategoryID:       NullInt32Ptr(row.TkCategory),
		ImageURL:         NullStringPtr(row.ImageUrl),
		CategoryName:     NullStringPtr(row.CategoryName),
	}
}

// QuizFromUpdateRow maps an update response row to the API DTO.
func QuizFromUpdateRow(row sqlc.UpdateQuizRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      NullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      NullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		CategoryID:       NullInt32Ptr(row.TkCategory),
		ImageURL:         NullStringPtr(row.ImageUrl),
	}
}

// QuizFromPublishRow maps a publish response row to the API DTO.
func QuizFromPublishRow(row sqlc.SetQuizPublishDateRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      NullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      NullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		CategoryID:       NullInt32Ptr(row.TkCategory),
		ImageURL:         NullStringPtr(row.ImageUrl),
	}
}

// QuizFromArchiveRow maps an archive response row to the API DTO.
func QuizFromArchiveRow(row sqlc.ArchiveQuizRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      NullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      NullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		CategoryID:       NullInt32Ptr(row.TkCategory),
		ImageURL:         NullStringPtr(row.ImageUrl),
	}
}

// QuizFromListRow maps the list query projection to the API DTO.
func QuizFromListRow(id int32, title string, description sql.NullString, createdAt time.Time, publishDate sql.NullTime, ownerID int32, isArchived bool, timeLimitSeconds int32, questionCount int32, categoryID sql.NullInt32, imageURL sql.NullString, categoryName sql.NullString) QuizDTO {
	count := questionCount
	return QuizDTO{
		ID:               id,
		Title:            title,
		Description:      NullStringPtr(description),
		CreatedAt:        createdAt,
		PublishDate:      NullTimePtr(publishDate),
		OwnerID:          ownerID,
		IsArchived:       isArchived,
		TimeLimitSeconds: timeLimitSeconds,
		QuestionCount:    Int32Ptr(count),
		CategoryID:       NullInt32Ptr(categoryID),
		ImageURL:         NullStringPtr(imageURL),
		CategoryName:     NullStringPtr(categoryName),
	}
}
