-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" ADD COLUMN     "fees24hAth" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fees24hAtl" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalLiquidityAth" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalLiquidityAtl" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "volume24hAth" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "volume24hAtl" DOUBLE PRECISION NOT NULL DEFAULT 0;