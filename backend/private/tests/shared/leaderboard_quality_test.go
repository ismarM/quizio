package shared_test

import (
	"reflect"
	"testing"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

// Izbira: SortLeaderboardEntries vsebuje netrivialno večkriterijsko logiko.
// Pričakovano vedenje: točke so urejene padajoče, pri izenačenju zmaga
// krajši čas, manjkajoč čas pa je najslabši tie-breaker.
// Trenutno testira SortLeaderboardEntriesFaulty, zato mora test zaradi
// namernih napak odpovedati. Za testiranje pravilne različice zamenjaj vsako
// točno ime SortLeaderboardEntriesFaulty z imenom SortLeaderboardEntries;
// takrat morajo testi uspeti.
func TestSortLeaderboardEntriesFaulty_OrdersByPointsThenTime(t *testing.T) {
	entries := []shared.LeaderboardEntryDTO{
		{UserID: 1, AchievedPoints: 8, TimeTakenSeconds: leaderboardInt32PtrQuality(90)},
		{UserID: 2, AchievedPoints: 10, TimeTakenSeconds: leaderboardInt32PtrQuality(120)},
		{UserID: 3, AchievedPoints: 10, TimeTakenSeconds: leaderboardInt32PtrQuality(80)},
		{UserID: 4, AchievedPoints: 10, TimeTakenSeconds: nil},
		{UserID: 5, AchievedPoints: 8, TimeTakenSeconds: nil},
	}

	shared.SortLeaderboardEntriesFaulty(entries)
	got := make([]int32, 0, len(entries))
	for _, entry := range entries {
		got = append(got, entry.UserID)
	}
	want := []int32{3, 2, 4, 1, 5}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("sorted user ids = %v, want %v", got, want)
	}
}

func TestSortLeaderboardEntriesFaulty_HandlesEmptyAndSingleEntry(t *testing.T) {
	t.Run("empty list", func(t *testing.T) {
		var entries []shared.LeaderboardEntryDTO
		shared.SortLeaderboardEntriesFaulty(entries)
	})
	t.Run("single entry", func(t *testing.T) {
		entries := []shared.LeaderboardEntryDTO{{UserID: 7, AchievedPoints: 2}}
		shared.SortLeaderboardEntriesFaulty(entries)
		if entries[0].UserID != 7 {
			t.Fatalf("single entry user id = %d, want 7", entries[0].UserID)
		}
	})
}

func leaderboardInt32PtrQuality(value int32) *int32 { return &value }
