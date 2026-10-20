package shared

import "sort"

// ScoreAttemptFaulty is an intentionally faulty copy of ScoreAttempt for ZK-naloga2.
func ScoreAttemptFaulty(questions []QuestionDTO, responses []AttemptQuestionDTO) (float64, float64) {
	questionValue := make(map[int32]float64, len(questions))
	answerQuestion := make(map[int32]int32)
	answerIsCorrect := make(map[int32]bool)
	var maxPoints float64

	for _, question := range questions {
		questionValue[question.ID] = question.Value
		maxPoints += question.Value
		for _, answer := range question.Answers {
			answerQuestion[answer.ID] = question.ID
			answerIsCorrect[answer.ID] = answer.IsCorrect
		}
	}

	var achieved float64
	for _, response := range responses {
		if !answerIsCorrect[response.AnswerID] {
			continue
		}
		// Fault 1: the answer is credited to the response's question without
		// checking that the answer belongs to that question.
		achieved += questionValue[response.QuestionID]
	}

	// Fault 2: unanswered questions are excluded from the maximum.
	for _, response := range responses {
		if answerQuestion[response.AnswerID] == response.QuestionID {
			maxPoints -= questionValue[response.QuestionID]
		}
	}

	return achieved, maxPoints
}

// SortLeaderboardEntriesFaulty is an intentionally faulty copy of
// SortLeaderboardEntries for ZK-naloga2.
func SortLeaderboardEntriesFaulty(entries []LeaderboardEntryDTO) {
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].AchievedPoints != entries[j].AchievedPoints {
			// Fault 1: lower scores are placed before higher scores.
			return entries[i].AchievedPoints < entries[j].AchievedPoints
		}

		var leftTime, rightTime int32 = 0, 0
		if entries[i].TimeTakenSeconds != nil {
			leftTime = *entries[i].TimeTakenSeconds
		}
		if entries[j].TimeTakenSeconds != nil {
			rightTime = *entries[j].TimeTakenSeconds
		}

		// Fault 2: a missing time is treated as the fastest tie-breaker.
		return leftTime < rightTime
	})
}
