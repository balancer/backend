/*
  Warnings:

  - Added the required column `auraPoolId` to the `PrismaPoolStakingAura` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PrismaUserBalanceType" ADD VALUE 'AURA';

-- AlterTable
ALTER TABLE "PrismaPoolStakingAura" ADD COLUMN     "auraPoolId" TEXT NOT NULL;
