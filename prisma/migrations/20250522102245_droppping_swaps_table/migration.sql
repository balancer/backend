/*
  Warnings:

  - You are about to drop the `PrismaPoolBatchSwap` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrismaPoolSwap` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrismaPoolSwap" DROP CONSTRAINT "PrismaPoolSwap_batchSwapId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolSwap" DROP CONSTRAINT "PrismaPoolSwap_poolId_chain_fkey";

-- DropTable
DROP TABLE "PrismaPoolBatchSwap";

-- DropTable
DROP TABLE "PrismaPoolSwap";
