-- CreateTable
CREATE TABLE "PrismaSftmxVault" (
    "id" TEXT NOT NULL,
    "vaultIndex" INTEGER NOT NULL,
    "ftmStakingId" TEXT NOT NULL,
    "ftmStaked" TEXT NOT NULL,
    "matured" BOOLEAN NOT NULL,
    "unlockTimestamp" INTEGER NOT NULL,
    "validatorId" TEXT NOT NULL,
    "validatorAddress" TEXT NOT NULL,

    CONSTRAINT "PrismaSftmxVault_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaSftmxVault" ADD CONSTRAINT "PrismaSftmxVault_ftmStakingId_fkey" FOREIGN KEY ("ftmStakingId") REFERENCES "PrismaSftmxStakingData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
