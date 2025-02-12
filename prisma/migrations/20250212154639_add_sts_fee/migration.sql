-- AlterTable
ALTER TABLE "PrismaSonicStakingDataSnapshot" ADD COLUMN     "protocolFee24h" TEXT NOT NULL DEFAULT '0';

-- AlterTable
ALTER TABLE "PrismaStakedSonicData" ADD COLUMN     "protocolFee24h" TEXT NOT NULL DEFAULT '0';
