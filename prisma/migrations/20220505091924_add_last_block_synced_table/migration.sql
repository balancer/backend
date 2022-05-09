-- CreateEnum
CREATE TYPE "PrismaLastBlockSyncedCategory" AS ENUM ('POOLS', 'FARMS');

-- CreateTable
CREATE TABLE "PrismaLastBlockSynced" (
    "category" "PrismaLastBlockSyncedCategory" NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "PrismaLastBlockSynced_pkey" PRIMARY KEY ("category")
);
