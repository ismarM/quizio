package ismar_test

import (
	"testing"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestScoreAttempt_VariedResponses_ReturnsExpectedTotals(t *testing.T) {
	questions := []shared.QuestionDTO{
		{
			ID:    1,
			Value: 2.5,
			Answers: []shared.AnswerDTO{
				{ID: 10, IsCorrect: true},
				{ID: 11, IsCorrect: false},
			},
		},
		{
			ID:    2,
			Value: 1.5,
			Answers: []shared.AnswerDTO{
				{ID: 20, IsCorrect: false},
				{ID: 21, IsCorrect: true},
			},
		},
		{
			ID:    3,
			Value: 0,
			Answers: []shared.AnswerDTO{
				{ID: 30, IsCorrect: true},
			},
		},
	}

	tests := []struct {
		name         string
		questions    []shared.QuestionDTO
		responses    []shared.AttemptQuestionDTO
		wantAchieved float64
		wantMaximum  float64
	}{
		{
			name:         "empty quiz has zero totals",
			questions:    nil,
			responses:    nil,
			wantAchieved: 0,
			wantMaximum:  0,
		},
		{
			name:         "unanswered quiz awards zero but keeps maximum",
			questions:    questions,
			responses:    nil,
			wantAchieved: 0,
			wantMaximum:  4,
		},
		{
			name:      "correct and incorrect answers score only the correct one",
			questions: questions,
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 1, AnswerID: 10},
				{QuestionID: 2, AnswerID: 20},
			},
			wantAchieved: 2.5,
			wantMaximum:  4,
		},
		{
			name:      "all correct answers include fractional points",
			questions: questions,
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 2, AnswerID: 21},
				{QuestionID: 1, AnswerID: 10},
				{QuestionID: 3, AnswerID: 30},
			},
			wantAchieved: 4,
			wantMaximum:  4,
		},
		{
			name:         "unknown answer earns no points",
			questions:    questions,
			responses:    []shared.AttemptQuestionDTO{{QuestionID: 1, AnswerID: 999}},
			wantAchieved: 0,
			wantMaximum:  4,
		},
		{
			name:         "correct answer attached to another question earns no points",
			questions:    questions,
			responses:    []shared.AttemptQuestionDTO{{QuestionID: 2, AnswerID: 10}},
			wantAchieved: 0,
			wantMaximum:  4,
		},
		{
			name:         "unknown question with a known answer earns no points",
			questions:    questions,
			responses:    []shared.AttemptQuestionDTO{{QuestionID: 999, AnswerID: 10}},
			wantAchieved: 0,
			wantMaximum:  4,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotAchieved, gotMaximum := shared.ScoreAttempt(tt.questions, tt.responses)
			if gotAchieved != tt.wantAchieved {
				t.Errorf("ScoreAttempt() achieved = %v, want %v", gotAchieved, tt.wantAchieved)
			}
			if gotMaximum != tt.wantMaximum {
				t.Errorf("ScoreAttempt() maximum = %v, want %v", gotMaximum, tt.wantMaximum)
			}
		})
	}
}
