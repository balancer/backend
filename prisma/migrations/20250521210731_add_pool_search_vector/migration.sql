-- Add full-text search capabilities to PrismaPool
-- Step 1: Add the tsvector column
ALTER TABLE "PrismaPool" ADD COLUMN search_vector tsvector;

-- Step 2: Create a function to generate the search vector from pool data
CREATE OR REPLACE FUNCTION generate_pool_search_vector(pool_id TEXT, chain_id TEXT)
RETURNS tsvector AS $$
DECLARE
  protocol_version_part TEXT;
  name_symbol_part TEXT;
  token_data_part TEXT;
  hook_data_part TEXT;
BEGIN
  -- Get protocol version separately
  SELECT CASE
    WHEN p."protocolVersion" = 1 THEN 'COW'
    ELSE 'v' || COALESCE(p."protocolVersion"::TEXT, '')
  END
  INTO protocol_version_part
  FROM "PrismaPool" p
  WHERE p.id = pool_id AND p.chain::TEXT = chain_id;

  -- Get name/symbol/address/type/chain/categories
  SELECT
    COALESCE(p.name, '') || ' ' ||
    COALESCE(p.symbol, '') || ' ' ||
    COALESCE(p.address, '') || ' ' ||
    COALESCE(p.type::TEXT, '') || ' ' ||
    COALESCE(p.chain::TEXT, '') || ' ' ||
    COALESCE(array_to_string(p.categories, ' '), '')
  INTO name_symbol_part
  FROM "PrismaPool" p
  WHERE p.id = pool_id AND p.chain::TEXT = chain_id;

  -- Get token data
  SELECT string_agg(
    COALESCE(tk.name, '') || ' ' ||
    COALESCE(tk.symbol, '') || ' ' ||
    COALESCE(t.address, '') || ' ' ||
    COALESCE(ut.name, '') || ' ' ||
    COALESCE(ut.symbol, '') || ' ' ||
    COALESCE(tk."underlyingTokenAddress", ''),
    ' '
  )
  INTO token_data_part
  FROM "PrismaPoolToken" t
  JOIN "PrismaToken" tk ON t.address = tk.address AND t.chain::TEXT = tk.chain::TEXT
  LEFT JOIN "PrismaToken" ut ON ut.address = tk."underlyingTokenAddress" AND ut.chain::TEXT = tk.chain::TEXT
  WHERE t."poolId" = pool_id AND t.chain::TEXT = chain_id;

  -- Optional: hook types (least important)
  SELECT
    COALESCE(hook->>'type', '')
  INTO hook_data_part
  FROM "PrismaPool" p
  WHERE p.id = pool_id AND p.chain::TEXT = chain_id AND p.hook IS NOT NULL;

  -- Return weighted tsvector (with punctuation replaced by space)
  RETURN
    setweight(to_tsvector('simple', protocol_version_part), 'A') ||
    to_tsvector('simple', regexp_replace(name_symbol_part || ' ' || token_data_part || ' ' || COALESCE(hook_data_part, ''), '[-/]', ' ', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Step 3: Initial population of search vectors
UPDATE "PrismaPool"
SET search_vector = generate_pool_search_vector(id, chain::TEXT);

-- Step 4: Create unified function for search vector updates
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Case 1: Called from PrismaPool trigger (AFTER INSERT/UPDATE)
  IF TG_TABLE_NAME = 'PrismaPool' THEN
    UPDATE "PrismaPool"
    SET search_vector = generate_pool_search_vector(id, chain::TEXT)
    WHERE id = NEW."id" AND chain::TEXT = NEW.chain::TEXT;
    RETURN NEW;

  -- Case 2: Called from PrismaPoolToken trigger (AFTER INSERT/UPDATE)
  ELSIF TG_TABLE_NAME = 'PrismaPoolToken' THEN
    UPDATE "PrismaPool"
    SET search_vector = generate_pool_search_vector(id, chain::TEXT)
    WHERE id = NEW."poolId" AND chain::TEXT = NEW.chain::TEXT;
    RETURN NEW;

  -- Case 3: Called from PrismaToken trigger (AFTER UPDATE)
  ELSIF TG_TABLE_NAME = 'PrismaToken' AND (TG_OP = 'UPDATE') THEN
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
$$ LANGUAGE plpgsql;

-- Step 5: Create GIN index on the search_vector for fast searching
CREATE INDEX "PrismaPool_search_vector_idx" ON "PrismaPool" USING GIN (search_vector);

-- Step 6: Create triggers for all related tables using the unified function
CREATE TRIGGER trig_update_pool_search_vector
AFTER INSERT OR UPDATE OF name, symbol, address, type, chain, categories, "protocolVersion", hook
ON "PrismaPool"
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trig_update_pool_search_vector_on_token_change
AFTER INSERT OR UPDATE ON "PrismaPoolToken"
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER trig_update_pool_search_vector_on_prismatoken_change
AFTER UPDATE OF name, symbol ON "PrismaToken"
FOR EACH ROW EXECUTE FUNCTION update_search_vector();
