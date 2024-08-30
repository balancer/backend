-- DropIndex
DROP INDEX "PrismaPoolDynamicData_totalShares_idx";

-- CreateIndex
CREATE INDEX "PrismaPoolDynamicData_totalSharesNum_idx" ON "PrismaPoolDynamicData"("totalSharesNum" DESC);
