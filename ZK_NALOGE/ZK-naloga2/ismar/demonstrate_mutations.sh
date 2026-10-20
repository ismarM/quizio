#!/usr/bin/env bash
set -euo pipefail

assignment_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_dir="$(cd "${assignment_dir}/../../.." && pwd)"
evidence_dir="${assignment_dir}/test-evidence"
mutation_root="$(mktemp -d /tmp/quizio-ismar-mutations.XXXXXX)"
task_go_cache="${TASK_GO_CACHE:-/tmp/quizio-go-cache}"
task_go_mod_cache="${TASK_GO_MOD_CACHE:-/tmp/quizio-go-mod-cache}"

trap 'rm -rf "${mutation_root}"' EXIT
mkdir -p "${evidence_dir}"

run_tests() {
	local working_dir="$1"
	local test_pattern="$2"
	local output_file="$3"
	(
		cd "${working_dir}"
		GOCACHE="${task_go_cache}" GOMODCACHE="${task_go_mod_cache}" \
			go test -count=1 -v -run "${test_pattern}" ./...
	) >"${output_file}" 2>&1
}

run_mutation() {
	local number="$1"
	local label="$2"
	local test_pattern="$3"
	local source_relative="$4"
	local old_code="$5"
	local new_code="$6"
	local case_dir="${mutation_root}/${number}-${label}"
	local backend_dir="${case_dir}/backend"
	local tests_dir="${case_dir}/ismar"
	local output_file="${evidence_dir}/${number}-${label}.txt"

	mkdir -p "${case_dir}"
	cp -R "${repository_dir}/backend" "${backend_dir}"
	cp -R "${assignment_dir}" "${tests_dir}"
	(
		cd "${tests_dir}"
		go mod edit -replace "github.com/ismarM/quizio=${backend_dir}"
	)

	OLD_CODE="${old_code}" NEW_CODE="${new_code}" perl -0pi -e '
		BEGIN { $old = $ENV{"OLD_CODE"}; $new = $ENV{"NEW_CODE"}; }
		if (index($_, $old) < 0) { die "mutation target not found\n"; }
		s/\Q$old\E/$new/;
	' "${backend_dir}/${source_relative}"

	if run_tests "${tests_dir}" "${test_pattern}" "${output_file}"; then
		echo "Mutation ${number} (${label}) was not detected." >&2
		return 1
	fi
	echo "Mutation ${number} (${label}) correctly caused a test failure."
}

run_tests "${assignment_dir}" '^Test' "${evidence_dir}/00-baseline-pass.txt"

run_mutation \
	"01" \
	"score-maximum-omitted" \
	'^TestScoreAttempt_' \
	'internal/httpapi/shared/scoring.go' \
	$'\t\tmaxPoints += question.Value\n' \
	''

run_mutation \
	"02" \
	"score-question-check-omitted" \
	'^TestScoreAttempt_' \
	'internal/httpapi/shared/scoring.go' \
	$'\t\tif answerQuestion[response.AnswerID] != response.QuestionID {\n\t\t\tcontinue\n\t\t}\n' \
	''

run_mutation \
	"03" \
	"publish-archive-check-omitted" \
	'^TestIsQuizPublishLocked_' \
	'internal/httpapi/quizzes/publish_quiz.go' \
	$'\tif state.IsArchived {\n\t\treturn true\n\t}\n\n' \
	''

run_mutation \
	"04" \
	"publish-equality-unlocked" \
	'^TestIsQuizPublishLocked_' \
	'internal/httpapi/quizzes/publish_quiz.go' \
	'return state.PublishDate.Valid && !state.PublishDate.Time.After(now)' \
	'return state.PublishDate.Valid && state.PublishDate.Time.Before(now)'

run_mutation \
	"05" \
	"integrity-query-not-signed" \
	'^TestIntegrityMiddleware_' \
	'internal/httpapi/IntegrityMiddleware.go' \
	'requestPath := r.URL.RequestURI()' \
	'requestPath := r.URL.Path'

run_mutation \
	"06" \
	"integrity-future-timestamp-accepted" \
	'^TestIntegrityMiddleware_' \
	'internal/httpapi/IntegrityMiddleware.go' \
	'if nowMillis-timestampMillis > maxSkewMillis || timestampMillis-nowMillis > maxSkewMillis {' \
	'if nowMillis-timestampMillis > maxSkewMillis {'

run_tests "${assignment_dir}" '^Test' "${evidence_dir}/07-final-pass.txt"

echo "All six mutations were detected; baseline and restored code pass."
