-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" ADD COLUMN     "aggregateSwapFee" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "aggregateYieldFee" TEXT NOT NULL DEFAULT '0';
