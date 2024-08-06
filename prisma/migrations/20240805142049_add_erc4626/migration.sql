-- AlterEnum
ALTER TYPE "PrismaTokenTypeOption" ADD VALUE 'ERC4626';

-- AlterTable
ALTER TABLE "PrismaToken" ADD COLUMN     "underlyingTokenAddress" TEXT;
