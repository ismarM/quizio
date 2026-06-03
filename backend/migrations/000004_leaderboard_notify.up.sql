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

CREATE TRIGGER attempt_leaderboard_update_trigger
AFTER INSERT OR UPDATE ON quizio."Attempt"
FOR EACH ROW
EXECUTE FUNCTION quizio.notify_leaderboard_update();
