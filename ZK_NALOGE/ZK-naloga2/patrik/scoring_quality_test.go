// Izbira: ScoreAttempt vsebuje netrivialno poslovno logiko za seštevanje točk.
// Pričakovano vedenje: upošteva se le pravilen odgovor, ki pripada isti
// nalogi; največje možno število točk vključuje tudi neodgovorjene naloge.
// Testi so black-box testi po pogodbi funkcije in ne uporabljajo mockov,
// ker funkcija nima zunanjih odvisnosti.
// Trenutno testira ScoreAttemptFaulty, zato mora test zaradi namernih napak
// odpovedati. Za testiranje pravilne različice zamenjaj točno ime
// ScoreAttemptFaulty z imenom ScoreAttempt; takrat mora test uspeti.
package shared_test

import (
	"testing"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestScoreAttempt_ComputesAchievedAndMaximumPoints(t *testing.T) {
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
		wantMaximum  float64
	}{
		{
			name: "correct and incorrect answers",
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 1, AnswerID: 10},
				{QuestionID: 2, AnswerID: 20},
			},
			wantAchieved: 2.5,
			wantMaximum:  4,
		},
		{
			name: "unanswered question remains in maximum",
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 2, AnswerID: 21},
			},
			wantAchieved: 1.5,
			wantMaximum:  4,
		},
		{
			name: "unknown answer earns no points",
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 1, AnswerID: 999},
			},
			wantAchieved: 0,
			wantMaximum:  4,
		},
		{
			name: "answer from another question earns no points",
			responses: []shared.AttemptQuestionDTO{
				{QuestionID: 2, AnswerID: 10},
			},
			wantAchieved: 0,
			wantMaximum:  4,
		},
		{
			name:         "empty quiz has zero points",
			responses:    nil,
			wantAchieved: 0,
			wantMaximum:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotAchieved, gotMaximum := shared.ScoreAttemptFaulty(questionsForCase(tt.name, questions), tt.responses)
			if gotAchieved != tt.wantAchieved {
				t.Fatalf("achieved points = %v, want %v", gotAchieved, tt.wantAchieved)
			}
			if gotMaximum != tt.wantMaximum {
				t.Fatalf("maximum points = %v, want %v", gotMaximum, tt.wantMaximum)
			}
		})
	}
}

func questionsForCase(name string, questions []shared.QuestionDTO) []shared.QuestionDTO {
	if name == "empty quiz has zero points" {
		return nil
	}
	return questions
}
