/*
  Warnings:

  - Added the required column `balanceScaled` to the `PrismaUserStakedBalance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceScaled` to the `PrismaUserWalletBalance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PrismaUserStakedBalance" ADD COLUMN     "balanceScaled" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PrismaUserWalletBalance" ADD COLUMN     "balanceScaled" TEXT NOT NULL;
