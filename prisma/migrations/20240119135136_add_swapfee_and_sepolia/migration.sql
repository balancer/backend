-- AlterEnum
ALTER TYPE "Chain" ADD VALUE 'SEPOLIA';

-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" ADD COLUMN     "protocolSwapFee" TEXT NOT NULL DEFAULT '0';
