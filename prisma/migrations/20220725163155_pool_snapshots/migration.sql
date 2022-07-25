-- CreateTable
CREATE TABLE "PrismaPoolSnapshotData" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "totalLiquidity" TEXT NOT NULL,
    "sharePrice" TEXT NOT NULL,
    "volume24h" TEXT NOT NULL,
    "fees24h" TEXT NOT NULL,
    "totalShares" TEXT NOT NULL,
    "totalSwapVolume" TEXT NOT NULL,
    "totalSwapFee" TEXT NOT NULL,
    "swapsCount" TEXT NOT NULL,
    "holdersCount" TEXT NOT NULL,
    "amounts" TEXT[],

    CONSTRAINT "PrismaPoolSnapshotData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrismaPoolSnapshotData" ADD CONSTRAINT "PrismaPoolSnapshotData_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "PrismaPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
