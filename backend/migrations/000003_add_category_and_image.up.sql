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

-- Add category reference and cover image to Quiz
ALTER TABLE quizio."Quiz"
  ADD COLUMN tk_Category INT NULL,
  ADD COLUMN image_url VARCHAR(512) NULL;

-- Add foreign key constraint for category
ALTER TABLE quizio."Quiz"
  ADD CONSTRAINT fk_Quiz_Category1
  FOREIGN KEY (tk_Category)
  REFERENCES quizio."Category" (id_Category)
  ON DELETE SET NULL
  ON UPDATE NO ACTION;

-- Index for category foreign key
CREATE INDEX IF NOT EXISTS fk_Quiz_Category1_idx ON quizio."Quiz" (tk_Category);
