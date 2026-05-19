CREATE SCHEMA IF NOT EXISTS quizio;

-- -----------------------------------------------------
-- Table quizio.User
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."User" (
  id_User     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       VARCHAR(255) NOT NULL,
  is_admin    BOOLEAN      NOT NULL DEFAULT FALSE,
  displayName VARCHAR(45)  NULL,
  language    INT          NOT NULL DEFAULT 0,
  theme       INT          NOT NULL DEFAULT 0,
  profile_picture VARCHAR(255) NULL,
  CONSTRAINT email_UNIQUE       UNIQUE (email),
  CONSTRAINT displayName_UNIQUE UNIQUE (displayName)
);

-- -----------------------------------------------------
-- Table quizio.Quiz
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."Quiz" (
  id_Quiz     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  time_limit  TIME         NOT NULL,
  description TEXT         NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  publish_date TIMESTAMP   NULL,
  tk_User     INT          NOT NULL,
  is_archived BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT title_UNIQUE UNIQUE (title),
  CONSTRAINT fk_Quiz_User1
    FOREIGN KEY (tk_User)
    REFERENCES quizio."User" (id_User)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table quizio.Question
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."Question" (
  id_Question INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT         NOT NULL,
  value       FLOAT        NOT NULL,
  tk_Quiz     INT          NOT NULL,
  CONSTRAINT fk_Vprasanje_Kviz
    FOREIGN KEY (tk_Quiz)
    REFERENCES quizio."Quiz" (id_Quiz)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table quizio.Attempt
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."Attempt" (
  id_Attempt  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  start_time  TIMESTAMP    NOT NULL,
  time_taken  TIME         NULL,
  tk_Quiz     INT          NOT NULL,
  tk_User     INT          NOT NULL,
  CONSTRAINT fk_Attempt_Quiz1
    FOREIGN KEY (tk_Quiz)
    REFERENCES quizio."Quiz" (id_Quiz)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Attempt_User1
    FOREIGN KEY (tk_User)
    REFERENCES quizio."User" (id_User)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table quizio.Answer
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."Answer" (
  id_Answer   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT         NOT NULL,
  tk_Question INT          NOT NULL,
  is_correct  BOOLEAN      NOT NULL,
  CONSTRAINT fk_Answer_Question1
    FOREIGN KEY (tk_Question)
    REFERENCES quizio."Question" (id_Question)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- -----------------------------------------------------
-- Table quizio.Attempt_Question
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."Attempt_Question" (
  tk_Attempt  INT NOT NULL,
  tk_Question INT NOT NULL,
  tk_Answer   INT NOT NULL,
  PRIMARY KEY (tk_Attempt, tk_Question),
  CONSTRAINT fk_Attempt_Answer_Attempt1
    FOREIGN KEY (tk_Attempt)
    REFERENCES quizio."Attempt" (id_Attempt)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Attempt_Answer_Question1
    FOREIGN KEY (tk_Question)
    REFERENCES quizio."Question" (id_Question)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Attempt_Question_Answer1
    FOREIGN KEY (tk_Answer)
    REFERENCES quizio."Answer" (id_Answer)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- Indexes
CREATE INDEX fk_Quiz_User1_idx            ON quizio."Quiz"             (tk_User);
CREATE INDEX fk_Vprasanje_Kviz_idx        ON quizio."Question"         (tk_Quiz);
CREATE INDEX fk_Attempt_Quiz1_idx         ON quizio."Attempt"          (tk_Quiz);
CREATE INDEX fk_Attempt_User1_idx         ON quizio."Attempt"          (tk_User);
CREATE INDEX fk_Answer_Question1_idx      ON quizio."Answer"           (tk_Question);
CREATE INDEX fk_Attempt_Answer_Attempt1_idx   ON quizio."Attempt_Question" (tk_Attempt);
CREATE INDEX fk_Attempt_Answer_Question1_idx  ON quizio."Attempt_Question" (tk_Question);
CREATE INDEX fk_Attempt_Question_Answer1_idx  ON quizio."Attempt_Question" (tk_Answer);