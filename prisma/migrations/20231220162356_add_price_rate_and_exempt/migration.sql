-- AlterTable
ALTER TABLE "PrismaPoolToken" ADD COLUMN     "exemptFromProtocolYieldFee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceRateProvider" TEXT;
