-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" ADD COLUMN     "fees24hAthTimestamp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fees24hAtlTimestamp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sharePriceAthTimestamp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sharePriceAtlTimestamp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalLiquidityAthTimestamp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalLiquidityAtlTimestamp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "volume24hAthTimestamp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "volume24hAtlTimestamp" INTEGER NOT NULL DEFAULT 0;
