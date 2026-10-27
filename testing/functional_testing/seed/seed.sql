-- Functional-test seed for Quizio. Idempotent: safe to run before every test run.
--
-- Creates / resets:
--   * user  functional_tests@nipravimail.com  (admin, English, Light theme)
--   * quiz  "FT Seed Quiz"  (published, 2 questions worth 2 + 3 points)
--   * one finished attempt of that user on that quiz: 2 / 5 points, 4 min 30 s
--
-- The Firebase account (email + password) must exist separately; the Go API
-- resolves the PostgreSQL user by email and the BFF copies is_admin into the
-- Firebase custom claims on login.

BEGIN;

-- User ---------------------------------------------------------------------
INSERT INTO quizio."User" (email, is_admin, displayName, language, theme)
VALUES ('functional_tests@nipravimail.com', TRUE, 'functional_tests', 0, 0)
ON CONFLICT (email) DO UPDATE
  SET is_admin    = TRUE,
      displayName = 'functional_tests',
      language    = 0,
      theme       = 0;

-- Remove quizzes left over from earlier runs (cascades to questions, answers,
-- attempts). "FT " is the prefix used by the tests for the quizzes they create.
DELETE FROM quizio."Quiz"
WHERE tk_User = (SELECT id_User FROM quizio."User" WHERE email = 'functional_tests@nipravimail.com')
  AND title LIKE 'FT %';

-- Quiz, questions, answers, attempt -----------------------------------------
DO $$
DECLARE
  v_user     INT;
  v_category INT;
  v_quiz     INT;
  v_q1       INT;
  v_q2       INT;
  v_q1_ok    INT;
  v_q2_bad   INT;
  v_attempt  INT;
BEGIN
  SELECT id_User INTO v_user
    FROM quizio."User" WHERE email = 'functional_tests@nipravimail.com';
  SELECT id_Category INTO v_category
    FROM quizio."Category" WHERE name = 'General';

  INSERT INTO quizio."Quiz"
    (title, time_limit, description, publish_date, tk_User, tk_Category)
  VALUES
    ('FT Seed Quiz', INTERVAL '10 minutes', 'Seeded quiz for functional tests',
     NOW() - INTERVAL '2 days', v_user, v_category)
  RETURNING id_Quiz INTO v_quiz;

  -- Question 1 (2 points): correct answer is "B"
  INSERT INTO quizio."Question" (title, value, tk_Quiz)
  VALUES ('FT seed question 1', 2, v_quiz) RETURNING id_Question INTO v_q1;
  INSERT INTO quizio."Answer" (title, tk_Question, is_correct) VALUES
    ('A', v_q1, FALSE),
    ('B', v_q1, TRUE),
    ('C', v_q1, FALSE),
    ('D', v_q1, FALSE);
  SELECT id_Answer INTO v_q1_ok
    FROM quizio."Answer" WHERE tk_Question = v_q1 AND is_correct;

  -- Question 2 (3 points): correct answer is "C"
  INSERT INTO quizio."Question" (title, value, tk_Quiz)
  VALUES ('FT seed question 2', 3, v_quiz) RETURNING id_Question INTO v_q2;
  INSERT INTO quizio."Answer" (title, tk_Question, is_correct) VALUES
    ('A', v_q2, FALSE),
    ('B', v_q2, FALSE),
    ('C', v_q2, TRUE),
    ('D', v_q2, FALSE);
  SELECT id_Answer INTO v_q2_bad
    FROM quizio."Answer" WHERE tk_Question = v_q2 AND title = 'A';

  -- Finished attempt: started one day ago, took 4 min 30 s.
  -- Q1 answered correctly (2 pts), Q2 answered wrongly (0 pts) => 2 / 5.
  INSERT INTO quizio."Attempt" (start_time, time_taken, tk_Quiz, tk_User)
  VALUES (NOW() - INTERVAL '1 day', TIME '00:04:30', v_quiz, v_user)
  RETURNING id_Attempt INTO v_attempt;

  INSERT INTO quizio."Attempt_Question" (tk_Attempt, tk_Question, tk_Answer) VALUES
    (v_attempt, v_q1, v_q1_ok),
    (v_attempt, v_q2, v_q2_bad);
END $$;

COMMIT;
