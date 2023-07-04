-- CreateEnum
CREATE TYPE "PrismaRootStakingGaugeStatus" AS ENUM ('KILLED', 'ACTIVE');

-- CreateTable
CREATE TABLE "PrismaRootStakingGauge" (
    "id" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "status" "PrismaRootStakingGaugeStatus" NOT NULL DEFAULT 'ACTIVE',
    "gaugeAddress" TEXT NOT NULL,
    "stakingId" TEXT,
    "relativeWeight" TEXT,
    "relativeWeightCap" TEXT,

    CONSTRAINT "PrismaRootStakingGauge_pkey" PRIMARY KEY ("id","chain")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaRootStakingGauge_stakingId_chain_key" ON "PrismaRootStakingGauge"("stakingId", "chain");

-- AddForeignKey
ALTER TABLE "PrismaRootStakingGauge" ADD CONSTRAINT "PrismaRootStakingGauge_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStakingGauge"("id", "chain") ON DELETE RESTRICT ON UPDATE CASCADE;
