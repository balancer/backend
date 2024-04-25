-- DropForeignKey
ALTER TABLE "PrismaPoolCategory" DROP CONSTRAINT "PrismaPoolCategory_poolId_chain_fkey";

-- AddForeignKey
ALTER TABLE "PrismaPoolCategory" ADD CONSTRAINT "PrismaPoolCategory_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;
