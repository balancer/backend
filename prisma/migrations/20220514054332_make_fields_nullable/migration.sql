-- AlterTable
ALTER TABLE "PrismaTokenDynamicData" ALTER COLUMN "marketCap" DROP NOT NULL,
ALTER COLUMN "fdv" DROP NOT NULL,
ALTER COLUMN "priceChangePercent7d" DROP NOT NULL,
ALTER COLUMN "priceChangePercent14d" DROP NOT NULL,
ALTER COLUMN "priceChangePercent30d" DROP NOT NULL;
