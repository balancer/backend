/*
  Warnings:

  - You are about to drop the column `coingecko` on the `PrismaTokenCurrentPrice` table. All the data in the column will be lost.
  - You are about to drop the column `coingecko` on the `PrismaTokenPrice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "excludedFromCoingecko" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PrismaTokenCurrentPrice" DROP COLUMN "coingecko",
ADD COLUMN     "updatedBy" TEXT;

-- AlterTable
ALTER TABLE "PrismaTokenPrice" DROP COLUMN "coingecko",
ADD COLUMN     "updatedBy" TEXT;
