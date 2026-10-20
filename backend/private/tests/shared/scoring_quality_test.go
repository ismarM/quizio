package shared_test

import (
	"testing"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

// Izbira: ScoreAttempt vsebuje netrivialno poslovno logiko za seštevanje točk.
// Pričakovano vedenje: upošteva se le pravilen odgovor, ki pripada isti
// nalogi; največje možno število točk vključuje tudi neodgovorjene naloge.
// Funkcija nima zunanjih odvisnosti, zato mocki niso potrebni.
// Trenutno testira ScoreAttemptFaulty, zato mora test zaradi namernih napak
// odpovedati. Za testiranje pravilne različice zamenjaj točno ime
// ScoreAttemptFaulty z imenom ScoreAttempt; takrat mora test uspeti.
func TestScoreAttemptFaulty_ComputesAchievedAndMaximumPoints(t *testing.T) {
	questions := []shared.QuestionDTO{
		{ID: 1, Value: 2.5, Answers: []shared.AnswerDTO{
			{ID: 10, IsCorrect: true}, {ID: 11, IsCorrect: false},
		}},
		{ID: 2, Value: 1.5, Answers: []shared.AnswerDTO{
			{ID: 20, IsCorrect: false}, {ID: 21, IsCorrect: true},
		}},
	}

	tests := []struct {
		name         string
		responses    []shared.AttemptQuestionDTO
		wantAchieved float64
		wantMaximum  float64
	}{
		{"correct and incorrect answers", []shared.AttemptQuestionDTO{{QuestionID: 1, AnswerID: 10}, {QuestionID: 2, AnswerID: 20}}, 2.5, 4},
		{"unanswered question remains in maximum", []shared.AttemptQuestionDTO{{QuestionID: 2, AnswerID: 21}}, 1.5, 4},
		{"unknown answer earns no points", []shared.AttemptQuestionDTO{{QuestionID: 1, AnswerID: 999}}, 0, 4},
		{"answer from another question earns no points", []shared.AttemptQuestionDTO{{QuestionID: 2, AnswerID: 10}}, 0, 4},
		{"empty quiz has zero points", nil, 0, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotAchieved, gotMaximum := shared.ScoreAttemptFaulty(questionsForCase(tt.name, questions), tt.responses)
			if gotAchieved != tt.wantAchieved || gotMaximum != tt.wantMaximum {
				t.Fatalf("ScoreAttemptFaulty() = (%v, %v), want (%v, %v)", gotAchieved, gotMaximum, tt.wantAchieved, tt.wantMaximum)
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
