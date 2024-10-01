-- AlterTable
ALTER TABLE "PrismaPoolSnapshot" ADD COLUMN     "totalVolumes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PrismaPoolSnapshot" ADD COLUMN     "totalProtocolSwapFees" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PrismaPoolSnapshot" ADD COLUMN     "totalProtocolYieldFees" TEXT[] DEFAULT ARRAY[]::TEXT[];
