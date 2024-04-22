-- Make sure no new events are being written
LOCK TABLE "PrismaPoolEvent" IN EXCLUSIVE MODE;

-- CreateTable
CREATE TABLE "PartitionedPoolEvent" (
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

    CONSTRAINT "PartitionedPoolEvent_pkey" PRIMARY KEY ("id", "chain")
) PARTITION BY LIST (chain);

CREATE TABLE events_mainnet PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('MAINNET');
CREATE TABLE events_polygon PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('POLYGON');
CREATE TABLE events_arbitrum PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('ARBITRUM');
CREATE TABLE events_optimism PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('OPTIMISM');
CREATE TABLE events_base PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('BASE');
CREATE TABLE events_fantom PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('FANTOM');
CREATE TABLE events_zkevm PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('ZKEVM');
CREATE TABLE events_avalanche PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('AVALANCHE');
CREATE TABLE events_gnosis PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('GNOSIS');
CREATE TABLE events_sepolia PARTITION OF "PartitionedPoolEvent" FOR VALUES IN ('SEPOLIA');

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_chain_idx" ON "PartitionedPoolEvent"("chain");

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_type_idx" ON "PartitionedPoolEvent"("type");

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_chain_poolId_idx" ON "PartitionedPoolEvent"("chain", "poolId");

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_userAddress_idx" ON "PartitionedPoolEvent"("userAddress");

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_blockNumber_idx" ON "PartitionedPoolEvent"("blockNumber" DESC);

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_chain_blockNumber_idx" ON "PartitionedPoolEvent"("chain", "blockNumber" DESC);

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_blockTimestamp_idx" ON "PartitionedPoolEvent"("blockTimestamp" DESC);

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_logIndex_idx" ON "PartitionedPoolEvent"("logIndex" DESC);

-- CreateIndex
CREATE INDEX "PartitionedPoolEvent_vaultVersion_idx" ON "PartitionedPoolEvent"("vaultVersion");

INSERT INTO "PartitionedPoolEvent" ("id", "tx", "type", "chain", "poolId", "userAddress", "blockNumber", "blockTimestamp", "logIndex", "vaultVersion", "valueUSD", "payload")
SELECT "id", "tx", "type", "chain", "poolId", "userAddress", "blockNumber", "blockTimestamp", "logIndex", "vaultVersion", "valueUSD", "payload" FROM "PrismaPoolEvent";

DROP TABLE "PrismaPoolEvent";
