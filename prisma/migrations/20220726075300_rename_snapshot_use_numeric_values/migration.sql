/*
  Warnings:

  - You are about to drop the `PrismaPoolSnapshotData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrismaPoolSnapshotData" DROP CONSTRAINT "PrismaPoolSnapshotData_poolId_fkey";

-- DropTable
DROP TABLE "PrismaPoolSnapshotData";

-- CreateTable
CREATE TABLE "PrismaPoolSnapshot" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "totalLiquidity" DOUBLE PRECISION NOT NULL,
    "sharePrice" DOUBLE PRECISION NOT NULL,
    "volume24h" DOUBLE PRECISION NOT NULL,
    "fees24h" DOUBLE PRECISION NOT NULL,
    "totalShares" TEXT NOT NULL,
    "totalSharesNum" DOUBLE PRECISION NOT NULL,
    "totalSwapVolume" DOUBLE PRECISION NOT NULL,
    "totalSwapFee" DOUBLE PRECISION NOT NULL,
    "swapsCount" INTEGER NOT NULL,
    "holdersCount" INTEGER NOT NULL,
    "amounts" TEXT[],

    CONSTRAINT "PrismaPoolSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaPoolSnapshot" ADD CONSTRAINT "PrismaPoolSnapshot_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
