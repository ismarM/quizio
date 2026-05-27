ALTER TABLE quizio."Quiz" DROP CONSTRAINT IF EXISTS fk_Quiz_Category1;
DROP INDEX IF EXISTS quizio.fk_Quiz_Category1_idx;
ALTER TABLE quizio."Quiz" DROP COLUMN IF EXISTS tk_Category;
ALTER TABLE quizio."Quiz" DROP COLUMN IF EXISTS image_url;

DROP TABLE IF EXISTS quizio."Category";
