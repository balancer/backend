/*
  Warnings:

  - The `tvl` column on the `PrismaToken` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PrismaToken" DROP COLUMN "tvl",
ADD COLUMN     "tvl" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PrismaToken_tvl_idx" ON "PrismaToken"("tvl" DESC);

UPDATE "PrismaToken"
SET tvl = COALESCE(tvl_data.tvl, 0)
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
