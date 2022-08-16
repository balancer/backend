-- CreateTable
CREATE TABLE "PrismaPoolStakingGauge" (
    "id" TEXT NOT NULL,
    "stakingId" TEXT NOT NULL,
    "gaugeAddress" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStakingGauge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaPoolStakingGaugeReward" (
    "id" TEXT NOT NULL,
    "gaugeId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "rewardPerSecond" TEXT NOT NULL,

    CONSTRAINT "PrismaPoolStakingGaugeReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrismaPoolStakingGauge_stakingId_key" ON "PrismaPoolStakingGauge"("stakingId");

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingGauge" ADD CONSTRAINT "PrismaPoolStakingGauge_stakingId_fkey" FOREIGN KEY ("stakingId") REFERENCES "PrismaPoolStaking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingGaugeReward" ADD CONSTRAINT "PrismaPoolStakingGaugeReward_gaugeId_fkey" FOREIGN KEY ("gaugeId") REFERENCES "PrismaPoolStakingGauge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
