-- AlterTable
ALTER TABLE "PrismaPoolToken" ADD COLUMN     "scalingFactor" TEXT;

-- AlterTable
ALTER TABLE "PrismaPoolTokenDynamicData" ALTER COLUMN "balanceUSD" DROP NOT NULL,
ALTER COLUMN "priceRate" DROP NOT NULL;
