-- DropForeignKey
ALTER TABLE "PrismaPoolCategory" DROP CONSTRAINT "PrismaPoolCategory_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolToken" DROP CONSTRAINT "PrismaPoolToken_address_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolToken" DROP CONSTRAINT "PrismaPoolToken_nestedPoolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenCurrentPrice" DROP CONSTRAINT "PrismaTokenCurrentPrice_tokenAddress_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenDynamicData" DROP CONSTRAINT "PrismaTokenDynamicData_tokenAddress_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenPrice" DROP CONSTRAINT "PrismaTokenPrice_tokenAddress_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaTokenType" DROP CONSTRAINT "PrismaTokenType_tokenAddress_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserStakedBalance" DROP CONSTRAINT "PrismaUserStakedBalance_tokenAddress_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserStakedBalance" DROP CONSTRAINT "PrismaUserStakedBalance_userAddress_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserWalletBalance" DROP CONSTRAINT "PrismaUserWalletBalance_tokenAddress_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserWalletBalance" DROP CONSTRAINT "PrismaUserWalletBalance_userAddress_fkey";

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_address_chain_fkey" FOREIGN KEY ("address", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_nestedPoolId_chain_fkey" FOREIGN KEY ("nestedPoolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolCategory" ADD CONSTRAINT "PrismaPoolCategory_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenCurrentPrice" ADD CONSTRAINT "PrismaTokenCurrentPrice_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenPrice" ADD CONSTRAINT "PrismaTokenPrice_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenDynamicData" ADD CONSTRAINT "PrismaTokenDynamicData_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaTokenType" ADD CONSTRAINT "PrismaTokenType_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_userAddress_fkey" FOREIGN KEY ("userAddress") REFERENCES "PrismaUser"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_tokenAddress_chain_fkey" FOREIGN KEY ("tokenAddress", "chain") REFERENCES "PrismaToken"("address", "chain") ON DELETE CASCADE ON UPDATE CASCADE;
