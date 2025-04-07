-- CreateTable
CREATE TABLE "quant_weights" (
    "id" SERIAL NOT NULL,
    "pool" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "weight1" DOUBLE PRECISION NOT NULL,
    "weight2" DOUBLE PRECISION NOT NULL,
    "weight3" DOUBLE PRECISION,
    "weight4" DOUBLE PRECISION,
    "weight5" DOUBLE PRECISION,
    "weight6" DOUBLE PRECISION,
    "weight7" DOUBLE PRECISION,
    "weight8" DOUBLE PRECISION,

    CONSTRAINT "quant_weights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quant_weights_pool_chain_timestamp_idx" ON "quant_weights"("pool", "chain", "timestamp");
