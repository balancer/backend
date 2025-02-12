-- AlterTable
ALTER TABLE "PrismaErc4626ReviewData" ADD COLUMN     "canUseBufferForSwaps" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "useUnderlyingForAddRemove" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "useWrappedForAddRemove" BOOLEAN NOT NULL DEFAULT true;
