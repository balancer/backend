-- Simpler generate_pool_search_vector
CREATE OR REPLACE FUNCTION public.generate_pool_search_vector(
    pool_id TEXT,
    chain_id TEXT
) RETURNS tsvector
LANGUAGE plpgsql
AS $$
DECLARE
  protocol_version_part TEXT;
  name_symbol_part TEXT;
  token_data_part TEXT;
  hook_data_part TEXT;
  chain_text TEXT := chain_id;
BEGIN
  -- Single fetch from PrismaPool
  SELECT
    CASE WHEN "protocolVersion" = 1 THEN 'COW' ELSE 'v' || COALESCE("protocolVersion"::TEXT, '') END,
    COALESCE(name, '') || ' ' ||
    COALESCE(symbol, '') || ' ' ||
    COALESCE(address, '') || ' ' ||
    COALESCE(type::TEXT, '') || ' ' ||
    COALESCE(chain::TEXT, '') || ' ' ||
    COALESCE(array_to_string(categories, ' '), ''),
    COALESCE(hook->>'type', '')
  INTO protocol_version_part, name_symbol_part, hook_data_part
  FROM "PrismaPool"
  WHERE id = pool_id AND chain::TEXT = chain_text;

  -- Token string aggregation
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
  JOIN "PrismaToken" tk ON t.address = tk.address AND t.chain::TEXT = chain_text
  LEFT JOIN "PrismaToken" ut ON ut.address = tk."underlyingTokenAddress" AND ut.chain::TEXT = chain_text
  WHERE t."poolId" = pool_id AND t.chain::TEXT = chain_text;

  -- Final tsvector
  RETURN
    setweight(to_tsvector('simple', protocol_version_part), 'A') ||
    to_tsvector('simple', regexp_replace(name_symbol_part || ' ' || token_data_part || ' ' || COALESCE(hook_data_part, ''), '[-/]', ' ', 'g'));
END;
$$;

-- This trigger is not needed
DROP TRIGGER IF EXISTS trig_update_pool_search_vector_on_token_change ON "PrismaPoolToken";
