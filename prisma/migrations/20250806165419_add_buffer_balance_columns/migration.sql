-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "bufferBalanceUnderlying" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "bufferBalanceWrapped" TEXT NOT NULL DEFAULT '0';
