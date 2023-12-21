-- CreateTable
CREATE TABLE "PrismaSftmxStakingData" (
    "id" TEXT NOT NULL,
    "totalFtm" TEXT NOT NULL,
    "totalFtmStaked" TEXT NOT NULL,
    "totalFtmInPool" TEXT NOT NULL,
    "numberOfVaults" INTEGER NOT NULL,
    "stakingApr" TEXT NOT NULL,
    "exchangeRate" TEXT NOT NULL,
    "maxDepositLimit" TEXT NOT NULL,
    "minDepositLimit" TEXT NOT NULL,
    "withdrawalDelay" INTEGER NOT NULL,
    "undelegatePaused" BOOLEAN NOT NULL,
    "withdrawPaused" BOOLEAN NOT NULL,
    "maintenancePaused" BOOLEAN NOT NULL,

    CONSTRAINT "PrismaSftmxStakingData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrismaSftmxWithdrawalRequest" (
    "id" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "amountSftmx" TEXT NOT NULL,
    "requestTimestamp" INTEGER NOT NULL,
    "isWithdrawn" BOOLEAN NOT NULL,

    CONSTRAINT "PrismaSftmxWithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaSftmxWithdrawalRequest" ADD CONSTRAINT "PrismaSftmxWithdrawalRequest_id_fkey" FOREIGN KEY ("id") REFERENCES "PrismaSftmxStakingData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
