ALTER TABLE quizio."Quiz"
  ALTER COLUMN time_limit TYPE INTERVAL USING (time_limit::text::interval);

ALTER TABLE quizio."Attempt"
  ADD CONSTRAINT attempt_user_quiz_unique UNIQUE (tk_User, tk_Quiz);

ALTER TABLE quizio."Quiz" DROP CONSTRAINT fk_Quiz_User1;
ALTER TABLE quizio."Quiz"
  ADD CONSTRAINT fk_Quiz_User1
  FOREIGN KEY (tk_User)
  REFERENCES quizio."User" (id_User)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE quizio."Question" DROP CONSTRAINT fk_Vprasanje_Kviz;
ALTER TABLE quizio."Question"
  ADD CONSTRAINT fk_Vprasanje_Kviz
  FOREIGN KEY (tk_Quiz)
  REFERENCES quizio."Quiz" (id_Quiz)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE quizio."Attempt" DROP CONSTRAINT fk_Attempt_Quiz1;
ALTER TABLE quizio."Attempt"
  ADD CONSTRAINT fk_Attempt_Quiz1
  FOREIGN KEY (tk_Quiz)
  REFERENCES quizio."Quiz" (id_Quiz)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE quizio."Attempt" DROP CONSTRAINT fk_Attempt_User1;
ALTER TABLE quizio."Attempt"
  ADD CONSTRAINT fk_Attempt_User1
  FOREIGN KEY (tk_User)
  REFERENCES quizio."User" (id_User)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE quizio."Answer" DROP CONSTRAINT fk_Answer_Question1;
ALTER TABLE quizio."Answer"
  ADD CONSTRAINT fk_Answer_Question1
  FOREIGN KEY (tk_Question)
  REFERENCES quizio."Question" (id_Question)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE quizio."Attempt_Question" DROP CONSTRAINT fk_Attempt_Answer_Attempt1;
ALTER TABLE quizio."Attempt_Question"
  ADD CONSTRAINT fk_Attempt_Answer_Attempt1
  FOREIGN KEY (tk_Attempt)
  REFERENCES quizio."Attempt" (id_Attempt)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE quizio."Attempt_Question" DROP CONSTRAINT fk_Attempt_Answer_Question1;
ALTER TABLE quizio."Attempt_Question"
  ADD CONSTRAINT fk_Attempt_Answer_Question1
  FOREIGN KEY (tk_Question)
  REFERENCES quizio."Question" (id_Question)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

ALTER TABLE quizio."Attempt_Question" DROP CONSTRAINT fk_Attempt_Question_Answer1;
ALTER TABLE quizio."Attempt_Question"
  ADD CONSTRAINT fk_Attempt_Question_Answer1
  FOREIGN KEY (tk_Answer)
  REFERENCES quizio."Answer" (id_Answer)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;
