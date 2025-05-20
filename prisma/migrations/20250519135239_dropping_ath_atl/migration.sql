/*
  Warnings:

  - You are about to drop the column `fees24hAth` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `fees24hAthTimestamp` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `fees24hAtl` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `fees24hAtlTimestamp` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `sharePriceAth` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `sharePriceAthTimestamp` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `sharePriceAtl` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `sharePriceAtlTimestamp` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `totalLiquidityAth` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `totalLiquidityAthTimestamp` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `totalLiquidityAtl` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `totalLiquidityAtlTimestamp` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `volume24hAth` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `volume24hAthTimestamp` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `volume24hAtl` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.
  - You are about to drop the column `volume24hAtlTimestamp` on the `PrismaPoolDynamicData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" DROP COLUMN "fees24hAth",
DROP COLUMN "fees24hAthTimestamp",
DROP COLUMN "fees24hAtl",
DROP COLUMN "fees24hAtlTimestamp",
DROP COLUMN "sharePriceAth",
DROP COLUMN "sharePriceAthTimestamp",
DROP COLUMN "sharePriceAtl",
DROP COLUMN "sharePriceAtlTimestamp",
DROP COLUMN "totalLiquidityAth",
DROP COLUMN "totalLiquidityAthTimestamp",
DROP COLUMN "totalLiquidityAtl",
DROP COLUMN "totalLiquidityAtlTimestamp",
DROP COLUMN "volume24hAth",
DROP COLUMN "volume24hAthTimestamp",
DROP COLUMN "volume24hAtl",
DROP COLUMN "volume24hAtlTimestamp";
