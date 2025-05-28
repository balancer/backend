CREATE OR REPLACE FUNCTION public.update_search_vector()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
  -- Case 1: Called from PrismaPool trigger (AFTER INSERT/UPDATE)
  IF TG_TABLE_NAME ILIKE 'PrismaPool' THEN
    UPDATE "PrismaPool"
    SET search_vector = generate_pool_search_vector(id, chain::TEXT)
    WHERE id = NEW."id" AND chain::TEXT = NEW.chain::TEXT;
    RETURN NEW;

  -- Case 2: Called from PrismaPoolToken trigger (AFTER INSERT/UPDATE)
  ELSIF TG_TABLE_NAME ILIKE 'PrismaPoolToken' THEN
    UPDATE "PrismaPool"
    SET search_vector = generate_pool_search_vector(id, chain::TEXT)
    WHERE id = NEW."poolId" AND chain::TEXT = NEW.chain::TEXT;
    RETURN NEW;

  -- Case 3: Called from PrismaToken trigger (AFTER UPDATE)
  ELSIF TG_TABLE_NAME ILIKE 'PrismaToken' AND (TG_OP = 'UPDATE') THEN
    -- Update all pools that have this token
    UPDATE "PrismaPool" p
    SET search_vector = generate_pool_search_vector(p.id, p.chain::TEXT)
    WHERE EXISTS (
      SELECT 1 FROM "PrismaPoolToken" pt
      WHERE pt.address = NEW.address
      AND pt.chain::TEXT = NEW.chain::TEXT
      AND pt."poolId" = p.id
      AND pt.chain::TEXT = p.chain::TEXT
    );
    RETURN NEW;
  END IF;

  RETURN NULL; -- Should never reach here
END;
$BODY$;

CREATE TRIGGER trig_update_pool_search_vector_on_token_change
AFTER INSERT ON "PrismaPoolToken"
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Update all the pools that might have missed the search creation
UPDATE "PrismaPool"
SET search_vector = generate_pool_search_vector(id, chain::TEXT);
