-- CreateEnum
CREATE TYPE "PoolEventType" AS ENUM ('JOIN', 'EXIT', 'SWAP');

-- CreateTable
CREATE TABLE "PoolEvent" (
    "id" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "type" "PoolEventType" NOT NULL,
    "chain" "Chain" NOT NULL,
    "poolId" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "blockTimestamp" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "vaultVersion" INTEGER NOT NULL DEFAULT 2,
    "valueUSD" DOUBLE PRECISION NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "PoolEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoolEvent_type_idx" ON "PoolEvent"("type");

-- CreateIndex
CREATE INDEX "PoolEvent_chain_idx" ON "PoolEvent"("chain");

-- CreateIndex
CREATE INDEX "PoolEvent_chain_poolId_idx" ON "PoolEvent"("chain", "poolId");

-- CreateIndex
CREATE INDEX "PoolEvent_userAddress_idx" ON "PoolEvent"("userAddress");

-- CreateIndex
CREATE INDEX "PoolEvent_blockNumber_idx" ON "PoolEvent"("blockNumber");

-- CreateIndex
CREATE INDEX "PoolEvent_logIndex_idx" ON "PoolEvent"("logIndex");
