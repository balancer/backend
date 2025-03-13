-- AlterTable
ALTER TABLE "PrismaPoolDynamicData" ALTER COLUMN "swapFee" SET DEFAULT '0',
ALTER COLUMN "swapEnabled" SET DEFAULT true,
ALTER COLUMN "totalLiquidity" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PrismaPoolToken" ALTER COLUMN "balanceUSD" SET DEFAULT 0,
ALTER COLUMN "priceRate" SET DEFAULT '1.0';
