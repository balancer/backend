-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "tvl" TEXT NOT NULL DEFAULT '0';

-- CreateIndex
CREATE INDEX "PrismaToken_tvl_idx" ON "PrismaToken"("tvl" DESC);

UPDATE "PrismaToken"
SET tvl = COALESCE(tvl_data.tvl, '0')
FROM (
    SELECT
        address,
        chain,
        SUM("balanceUSD") AS tvl
    FROM "PrismaPoolToken"
    GROUP BY address, chain
) AS tvl_data
WHERE "PrismaToken".address = tvl_data.address
  AND "PrismaToken".chain = tvl_data.chain;
