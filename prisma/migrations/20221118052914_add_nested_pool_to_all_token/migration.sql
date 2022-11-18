-- AlterTable
ALTER TABLE "PrismaPoolExpandedTokens" ADD COLUMN     "nestedPoolId" TEXT;

-- AddForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" ADD CONSTRAINT "PrismaPoolExpandedTokens_nestedPoolId_fkey" FOREIGN KEY ("nestedPoolId") REFERENCES "PrismaPool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
