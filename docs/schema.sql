CREATE SCHEMA IF NOT EXISTS quizio;

-- -----------------------------------------------------
-- Table quizio.User
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."User" (
  id_User         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           VARCHAR(255) NOT NULL,
  is_admin        BOOLEAN      NOT NULL DEFAULT FALSE,
  displayName     VARCHAR(45)  NULL,
  language        INT          NOT NULL DEFAULT 0,
  theme           INT          NOT NULL DEFAULT 0,
  profile_picture VARCHAR(255) NULL,
  CONSTRAINT email_UNIQUE       UNIQUE (email),
  CONSTRAINT displayName_UNIQUE UNIQUE (displayName)
);

-- -----------------------------------------------------
-- Table quizio.Category
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."Category" (
  id_Category INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE
);

-- Seed default categories
INSERT INTO quizio."Category" (name) VALUES 
('General'),
('Science'),
('History'),
('Geography'),
('Pop Culture'),
('Sports')
ON CONFLICT (name) DO NOTHING;

-- -----------------------------------------------------
-- Table quizio.Quiz
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS quizio."Quiz" (
  id_Quiz          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  time_limit       INTERVAL     NOT NULL,
  description      TEXT         NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  publish_date     TIMESTAMP    NULL,
  tk_User          INT          NOT NULL,
  is_archived      BOOLEAN      NOT NULL DEFAULT FALSE,
  tk_Category      INT          NULL,
  image_url        VARCHAR(512) NULL,
  CONSTRAINT title_UNIQUE UNIQUE (title),
  CONSTRAINT fk_Quiz_User1
    FOREIGN KEY (tk_User)
    REFERENCES quizio."User" (id_User)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Quiz_Category1
    FOREIGN KEY (tk_Category)
    REFERENCES quizio."Category" (id_Category)
    ON DELETE SET NULL
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
    ON DELETE CASCADE
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
  CONSTRAINT attempt_user_quiz_unique UNIQUE (tk_User, tk_Quiz),
  CONSTRAINT fk_Attempt_Quiz1
    FOREIGN KEY (tk_Quiz)
    REFERENCES quizio."Quiz" (id_Quiz)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Attempt_User1
    FOREIGN KEY (tk_User)
    REFERENCES quizio."User" (id_User)
    ON DELETE CASCADE
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
    ON DELETE CASCADE
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
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Attempt_Answer_Question1
    FOREIGN KEY (tk_Question)
    REFERENCES quizio."Question" (id_Question)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT fk_Attempt_Question_Answer1
    FOREIGN KEY (tk_Answer)
    REFERENCES quizio."Answer" (id_Answer)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Indexes
CREATE INDEX IF NOT EXISTS fk_Quiz_User1_idx              ON quizio."Quiz"             (tk_User);
CREATE INDEX IF NOT EXISTS fk_Quiz_Category1_idx          ON quizio."Quiz"             (tk_Category);
CREATE INDEX IF NOT EXISTS fk_Vprasanje_Kviz_idx          ON quizio."Question"         (tk_Quiz);
CREATE INDEX IF NOT EXISTS fk_Attempt_Quiz1_idx           ON quizio."Attempt"          (tk_Quiz);
CREATE INDEX IF NOT EXISTS fk_Attempt_User1_idx           ON quizio."Attempt"          (tk_User);
CREATE INDEX IF NOT EXISTS fk_Answer_Question1_idx        ON quizio."Answer"           (tk_Question);
CREATE INDEX IF NOT EXISTS fk_Attempt_Answer_Attempt1_idx ON quizio."Attempt_Question" (tk_Attempt);
CREATE INDEX IF NOT EXISTS fk_Attempt_Answer_Question1_idx ON quizio."Attempt_Question" (tk_Question);
CREATE INDEX IF NOT EXISTS fk_Attempt_Question_Answer1_idx ON quizio."Attempt_Question" (tk_Answer);

-- Trigger Function & Trigger for Leaderboard Real-Time updates
CREATE OR REPLACE FUNCTION quizio.notify_leaderboard_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.time_taken IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND OLD.time_taken IS NULL AND NEW.time_taken IS NOT NULL) THEN
    PERFORM pg_notify('leaderboard_update', NEW.tk_Quiz::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER attempt_leaderboard_update_trigger
AFTER INSERT OR UPDATE ON quizio."Attempt"
FOR EACH ROW
EXECUTE FUNCTION quizio.notify_leaderboard_update();
