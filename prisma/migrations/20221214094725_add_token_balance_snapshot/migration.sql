-- CreateTable
CREATE TABLE "PrismaReliquaryTokenBalanceSnapshot" (
    "id" TEXT NOT NULL,
    "farmSnapshotId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "balance" TEXT NOT NULL,

    CONSTRAINT "PrismaReliquaryTokenBalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaReliquaryTokenBalanceSnapshot" ADD CONSTRAINT "PrismaReliquaryTokenBalanceSnapshot_farmSnapshotId_fkey" FOREIGN KEY ("farmSnapshotId") REFERENCES "PrismaReliquaryFarmSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
