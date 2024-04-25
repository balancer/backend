-- DropForeignKey
ALTER TABLE "PrismaPoolToken" DROP CONSTRAINT "PrismaPoolToken_nestedPoolId_chain_fkey";

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_nestedPoolId_chain_fkey" FOREIGN KEY ("nestedPoolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;
