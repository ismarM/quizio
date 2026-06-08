package shared_test

import (
	"reflect"
	"testing"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestScoreAttempt(t *testing.T) {
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
	}

	tests := []struct {
		name         string
		responses    []shared.AttemptQuestionDTO
		wantAchieved float64
		wantMax      float64
	}{
		{
			name: "scores only correct answers",
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 1, AnswerID: 10},
				{QuestionID: 2, AnswerID: 20},
			},
			wantAchieved: 2.5,
			wantMax:      4,
		},
		{
			name: "unanswered questions still count toward max",
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 2, AnswerID: 21},
			},
			wantAchieved: 1.5,
			wantMax:      4,
		},
		{
			name: "unknown answer is ignored",
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 1, AnswerID: 999},
			},
			wantAchieved: 0,
			wantMax:      4,
		},
		{
			name: "correct answer from another question is ignored",
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 2, AnswerID: 10},
			},
			wantAchieved: 0,
			wantMax:      4,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotAchieved, gotMax := shared.ScoreAttempt(questions, tt.responses)
			if gotAchieved != tt.wantAchieved {
				t.Fatalf("achieved = %v, want %v", gotAchieved, tt.wantAchieved)
			}
			if gotMax != tt.wantMax {
				t.Fatalf("max = %v, want %v", gotMax, tt.wantMax)
			}
		})
	}
}

func TestSortLeaderboardEntries(t *testing.T) {
	entries := []shared.LeaderboardEntryDTO{
		{UserID: 1, AchievedPoints: 8, TimeTakenSeconds: int32Ptr(90)},
		{UserID: 2, AchievedPoints: 10, TimeTakenSeconds: int32Ptr(120)},
		{UserID: 3, AchievedPoints: 10, TimeTakenSeconds: int32Ptr(80)},
		{UserID: 4, AchievedPoints: 10, TimeTakenSeconds: nil},
	}

	shared.SortLeaderboardEntries(entries)

	got := []int32{entries[0].UserID, entries[1].UserID, entries[2].UserID, entries[3].UserID}
	want := []int32{3, 2, 4, 1}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("sorted user ids = %v, want %v", got, want)
	}
}
