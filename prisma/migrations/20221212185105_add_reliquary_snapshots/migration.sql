-- CreateTable
CREATE TABLE "PrismaReliquaryFarmSnapshot" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "relicCount" INTEGER NOT NULL,
    "userCount" INTEGER NOT NULL,
    "totalBalance" TEXT NOT NULL,
    "dailyDeposited" TEXT NOT NULL,
    "dailyWithdrawn" TEXT NOT NULL,

    CONSTRAINT "PrismaReliquaryFarmSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaReliquaryFarmSnapshot" ADD CONSTRAINT "PrismaReliquaryFarmSnapshot_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "PrismaPoolStakingReliquaryFarm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
