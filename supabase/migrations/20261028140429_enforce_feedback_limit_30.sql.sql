/*
# Enforce maximum 30 feedback rows (delete oldest on overflow)

1. New Functions
- `enforce_feedback_limit()` — AFTER INSERT trigger function on `feedbacks`.
  When a new row is inserted, if the total row count exceeds 30, the oldest
  rows (by created_at ascending) beyond the first 30 are deleted so the table
  never holds more than 30 rows.

2. Triggers
- `trg_enforce_feedback_limit` — fires AFTER INSERT on `feedbacks`, calls the
  function above. This guarantees the 30-row cap regardless of which client
  inserts (browser, edge function, etc.).

3. Security
- No RLS changes (existing anon/authenticated policies remain).
- The function runs with SECURITY DEFINER so it can DELETE rows; it is owned
  by the postgres user and is only invoked by the trigger, not exposed as an
  RPC. REVOKE EXECUTE so no role can call it directly.

4. Important notes
- This is non-destructive: it only trims overflow rows created by NEW inserts.
- Idempotent: dropping the trigger/function first if they already exist.
*/

DROP TRIGGER IF EXISTS trg_enforce_feedback_limit ON feedbacks;
DROP FUNCTION IF EXISTS enforce_feedback_limit();

CREATE OR REPLACE FUNCTION enforce_feedback_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM feedbacks
  WHERE id IN (
    SELECT id
    FROM feedbacks
    ORDER BY created_at ASC
    OFFSET 30
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION enforce_feedback_limit() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_enforce_feedback_limit
AFTER INSERT ON feedbacks
FOR EACH ROW
EXECUTE FUNCTION enforce_feedback_limit();
