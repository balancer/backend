/*
  Warnings:

  - You are about to drop the column `totalSwapFee` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `totalSwapVolume` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" DROP COLUMN "totalSwapFee",
DROP COLUMN "totalSwapVolume";
