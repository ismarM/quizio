-- System-test (load) seed for Quizio. Idempotent: safe to run before every test run.
--
-- Clears ALL application data first (every quizio table except the Category
-- reference data seeded by the migrations), then creates:
--   * user  functional_tests@nipravimail.com        (regular user, NOT admin) - logs in during the load test
--   * user  system_tests_owner@nipravimail.com      (admin, DB-only, no Firebase account) - owns the quizzes
--   * 10 published quizzes "LT Quiz 01" .. "LT Quiz 10", 3 questions x 4 answers each
--
-- The Firebase account (email + password) for functional_tests must exist separately.
-- NOTE: this wipes the data created by testing/functional_testing/seed/seed.sql (which makes the same
-- user an admin). Re-run that seed before running the functional tests again.

BEGIN;

-- Clear database -------------------------------------------------------------
TRUNCATE quizio."Attempt_Question", quizio."Attempt", quizio."Answer",
         quizio."Question", quizio."Quiz", quizio."User"
  RESTART IDENTITY CASCADE;

-- Users --------------------------------------------------------------------
INSERT INTO quizio."User" (email, is_admin, displayName, language, theme)
VALUES ('functional_tests@nipravimail.com', FALSE, 'functional_tests', 0, 0)
ON CONFLICT (email) DO UPDATE
  SET is_admin    = FALSE,
      displayName = 'functional_tests',
      language    = 0,
      theme       = 0;

INSERT INTO quizio."User" (email, is_admin, displayName, language, theme)
VALUES ('system_tests_owner@nipravimail.com', TRUE, 'system_tests_owner', 0, 0)
ON CONFLICT (email) DO UPDATE
  SET is_admin    = TRUE,
      displayName = 'system_tests_owner';

-- Quizzes, questions, answers ------------------------------------------------
DO $$
DECLARE
  v_owner    INT;
  v_category INT;
  v_quiz     INT;
  v_question INT;
  i          INT;
  q          INT;
BEGIN
  SELECT id_User INTO v_owner
    FROM quizio."User" WHERE email = 'system_tests_owner@nipravimail.com';
  SELECT id_Category INTO v_category
    FROM quizio."Category" WHERE name = 'General';

  FOR i IN 1..10 LOOP
    INSERT INTO quizio."Quiz"
      (title, time_limit, description, publish_date, tk_User, tk_Category)
    VALUES
      ('LT Quiz ' || lpad(i::text, 2, '0'), INTERVAL '10 minutes',
       'Seeded quiz ' || i || ' for load tests',
       NOW() - INTERVAL '1 day', v_owner, v_category)
    RETURNING id_Quiz INTO v_quiz;

    FOR q IN 1..3 LOOP
      INSERT INTO quizio."Question" (title, value, tk_Quiz)
      VALUES ('LT quiz ' || i || ' question ' || q, q, v_quiz)
      RETURNING id_Question INTO v_question;

      INSERT INTO quizio."Answer" (title, tk_Question, is_correct) VALUES
        ('A', v_question, FALSE),
        ('B', v_question, TRUE),
        ('C', v_question, FALSE),
        ('D', v_question, FALSE);
    END LOOP;
  END LOOP;
END $$;

COMMIT;
