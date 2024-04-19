-- DropIndex
DROP INDEX "PrismaPoolEvent_blockNumber_idx";

-- DropIndex
DROP INDEX "PrismaPoolEvent_blockTimestamp_idx";

-- DropIndex
DROP INDEX "PrismaPoolEvent_logIndex_idx";

-- CreateIndex
CREATE INDEX "PrismaPoolEvent_blockNumber_idx" ON "PrismaPoolEvent"("blockNumber" DESC);

-- CreateIndex
CREATE INDEX "PrismaPoolEvent_blockTimestamp_idx" ON "PrismaPoolEvent"("blockTimestamp" DESC);

-- CreateIndex
CREATE INDEX "PrismaPoolEvent_logIndex_idx" ON "PrismaPoolEvent"("logIndex" DESC);
