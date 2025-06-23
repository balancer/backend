-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "maxDeposit" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "maxWithdraw" TEXT NOT NULL DEFAULT '0';
