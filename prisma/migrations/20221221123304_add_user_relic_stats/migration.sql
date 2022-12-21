-- CreateTable
CREATE TABLE "PrismaUserRelicSnapshot" (
    "id" TEXT NOT NULL,
    "userAddress" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "relicId" INTEGER NOT NULL,
    "farmId" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "entryTimestamp" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "PrismaUserRelicSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaUserRelicSnapshot" ADD CONSTRAINT "PrismaUserRelicSnapshot_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserRelicSnapshot" ADD CONSTRAINT "PrismaUserRelicSnapshot_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "PrismaPoolStakingReliquaryFarm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
