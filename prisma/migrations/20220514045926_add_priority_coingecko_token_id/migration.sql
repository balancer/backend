-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "coingeckoTokenId" TEXT,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;
