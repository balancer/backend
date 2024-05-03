-- Delete all PrismaPoolExpandedTokens that are linear pool BPTs.
BEGIN;
WITH tokens_bpt as (
    SELECT p.address, p.chain
    FROM "PrismaPool" p
    where p.type = 'LINEAR'
)
DELETE FROM "PrismaPoolExpandedTokens"
WHERE ("tokenAddress", chain) IN (select "address", chain from tokens_bpt);

-- Delete all PrismaTokens that are linear pool BPTs, this will also cascade to PrismaTokenPrice, PrismaTokenDynamicData, PrismaTokenCurrentPrice
WITH tokens_bpt as (
    SELECT p.address, p.chain
    FROM "PrismaPool" p
    where p.type = 'LINEAR'
)
DELETE FROM "PrismaToken"
WHERE ("address", chain) IN (select address, chain from tokens_bpt);

-- Delete all linear pools
DELETE FROM "PrismaPool" WHERE type='LINEAR';

-- Delete all the linear wrapped token types
DELETE FROM "PrismaTokenType" where type='LINEAR_WRAPPED_TOKEN';

-- Delete all the linear boosted APRs
DELETE FROM "PrismaPoolAprItem" where type='LINEAR_BOOSTED';
COMMIT;
