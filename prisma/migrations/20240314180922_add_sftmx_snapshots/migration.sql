-- CreateTable
CREATE TABLE "PrismaSftmxStakingDataSnapshot" (
    "id" TEXT NOT NULL,
    "ftmStakingId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "freePoolFtmAmount" TEXT NOT NULL,
    "lockedFtmAmount" TEXT NOT NULL,
    "totalFtmAmount" TEXT NOT NULL,
    "exchangeRate" TEXT NOT NULL,

    CONSTRAINT "PrismaSftmxStakingDataSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaSftmxStakingDataSnapshot" ADD CONSTRAINT "PrismaSftmxStakingDataSnapshot_ftmStakingId_fkey" FOREIGN KEY ("ftmStakingId") REFERENCES "PrismaSftmxStakingData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
