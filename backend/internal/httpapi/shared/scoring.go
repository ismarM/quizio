package shared

import "sort"

// ScoreAttempt calculates achieved and maximum points for a quiz attempt.
func ScoreAttempt(questions []QuestionDTO, responses []AttemptQuestionDTO) (float64, float64) {
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
		if answerQuestion[response.AnswerID] != response.QuestionID {
			continue
		}
		achieved += questionValue[response.QuestionID]
	}

	return achieved, maxPoints
}

// SortLeaderboardEntries orders leaderboard entries by points and completion time.
func SortLeaderboardEntries(entries []LeaderboardEntryDTO) {
	sort.Slice(entries, func(i, j int) bool {
		if entries[i].AchievedPoints != entries[j].AchievedPoints {
			return entries[i].AchievedPoints > entries[j].AchievedPoints
		}

		var leftTime, rightTime int32 = 999999, 999999
		if entries[i].TimeTakenSeconds != nil {
			leftTime = *entries[i].TimeTakenSeconds
		}
		if entries[j].TimeTakenSeconds != nil {
			rightTime = *entries[j].TimeTakenSeconds
		}

		return leftTime < rightTime
	})
}
