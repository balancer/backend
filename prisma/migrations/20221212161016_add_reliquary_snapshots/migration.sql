-- CreateTable
CREATE TABLE "PrismaReliquaryFarmSnapshot" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "relicCount" INTEGER NOT NULL,
    "userCount" INTEGER NOT NULL,
    "totalBalance" TEXT NOT NULL,
    "totalDeposited" TEXT NOT NULL,
    "totalWithdrawn" TEXT NOT NULL,
    "amounts" TEXT[],

    CONSTRAINT "PrismaReliquaryFarmSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaReliquaryFarmSnapshot" ADD CONSTRAINT "PrismaReliquaryFarmSnapshot_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "PrismaPoolStakingReliquaryFarm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
