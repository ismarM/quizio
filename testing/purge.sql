-- Purges all application data. Used by both test suites before and after every run.
-- Keeps quizio."Category" (reference data seeded by the migrations) and the schema.
TRUNCATE quizio."Attempt_Question", quizio."Attempt", quizio."Answer",
         quizio."Question", quizio."Quiz", quizio."User"
  RESTART IDENTITY CASCADE;
