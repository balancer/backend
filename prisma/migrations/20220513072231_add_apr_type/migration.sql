/*
  Warnings:

  - You are about to drop the column `isNativeRewardApr` on the `PrismaPoolAprItem` table. All the data in the column will be lost.
  - You are about to drop the column `isSwapApr` on the `PrismaPoolAprItem` table. All the data in the column will be lost.
  - You are about to drop the column `isThirdPartyApr` on the `PrismaPoolAprItem` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PrismaPoolAprType" AS ENUM ('SWAP', 'NATIVE_REWARD', 'THIRD_PARTY_REWARD', 'LINEAR_BOOSTED', 'PHANTOM_STABLE_BOOSTED');

-- AlterTable
ALTER TABLE "PrismaPoolAprItem" DROP COLUMN "isNativeRewardApr",
DROP COLUMN "isSwapApr",
DROP COLUMN "isThirdPartyApr",
ADD COLUMN     "type" "PrismaPoolAprType";
