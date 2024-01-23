-- DropForeignKey
ALTER TABLE "PrismaPoolAprItem" DROP CONSTRAINT "PrismaPoolAprItem_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolAprRange" DROP CONSTRAINT "PrismaPoolAprRange_aprItemId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolDynamicData" DROP CONSTRAINT "PrismaPoolDynamicData_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolElementData" DROP CONSTRAINT "PrismaPoolElementData_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" DROP CONSTRAINT "PrismaPoolExpandedTokens_nestedPoolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" DROP CONSTRAINT "PrismaPoolExpandedTokens_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolFilterMap" DROP CONSTRAINT "PrismaPoolFilterMap_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolGyroData" DROP CONSTRAINT "PrismaPoolGyroData_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolLinearData" DROP CONSTRAINT "PrismaPoolLinearData_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolLinearDynamicData" DROP CONSTRAINT "PrismaPoolLinearDynamicData_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolSnapshot" DROP CONSTRAINT "PrismaPoolSnapshot_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStableDynamicData" DROP CONSTRAINT "PrismaPoolStableDynamicData_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStaking" DROP CONSTRAINT "PrismaPoolStaking_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStakingGauge" DROP CONSTRAINT "PrismaPoolStakingGauge_stakingId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolStakingGaugeReward" DROP CONSTRAINT "PrismaPoolStakingGaugeReward_gaugeId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolSwap" DROP CONSTRAINT "PrismaPoolSwap_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolToken" DROP CONSTRAINT "PrismaPoolToken_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaPoolTokenDynamicData" DROP CONSTRAINT "PrismaPoolTokenDynamicData_poolTokenId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserStakedBalance" DROP CONSTRAINT "PrismaUserStakedBalance_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserStakedBalance" DROP CONSTRAINT "PrismaUserStakedBalance_stakingId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaUserWalletBalance" DROP CONSTRAINT "PrismaUserWalletBalance_poolId_chain_fkey";

-- DropForeignKey
ALTER TABLE "PrismaVotingGauge" DROP CONSTRAINT "PrismaVotingGauge_stakingGaugeId_chain_fkey";

-- AddForeignKey
ALTER TABLE "PrismaPoolLinearData" ADD CONSTRAINT "PrismaPoolLinearData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolElementData" ADD CONSTRAINT "PrismaPoolElementData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolGyroData" ADD CONSTRAINT "PrismaPoolGyroData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolDynamicData" ADD CONSTRAINT "PrismaPoolDynamicData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStableDynamicData" ADD CONSTRAINT "PrismaPoolStableDynamicData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolLinearDynamicData" ADD CONSTRAINT "PrismaPoolLinearDynamicData_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolToken" ADD CONSTRAINT "PrismaPoolToken_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolTokenDynamicData" ADD CONSTRAINT "PrismaPoolTokenDynamicData_poolTokenId_chain_fkey" FOREIGN KEY ("poolTokenId", "chain") REFERENCES "PrismaPoolToken"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolSwap" ADD CONSTRAINT "PrismaPoolSwap_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolAprItem" ADD CONSTRAINT "PrismaPoolAprItem_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolAprRange" ADD CONSTRAINT "PrismaPoolAprRange_aprItemId_chain_fkey" FOREIGN KEY ("aprItemId", "chain") REFERENCES "PrismaPoolAprItem"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" ADD CONSTRAINT "PrismaPoolExpandedTokens_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolExpandedTokens" ADD CONSTRAINT "PrismaPoolExpandedTokens_nestedPoolId_chain_fkey" FOREIGN KEY ("nestedPoolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolFilterMap" ADD CONSTRAINT "PrismaPoolFilterMap_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStaking" ADD CONSTRAINT "PrismaPoolStaking_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingGauge" ADD CONSTRAINT "PrismaPoolStakingGauge_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStaking"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolStakingGaugeReward" ADD CONSTRAINT "PrismaPoolStakingGaugeReward_gaugeId_chain_fkey" FOREIGN KEY ("gaugeId", "chain") REFERENCES "PrismaPoolStakingGauge"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaPoolSnapshot" ADD CONSTRAINT "PrismaPoolSnapshot_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserWalletBalance" ADD CONSTRAINT "PrismaUserWalletBalance_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_poolId_chain_fkey" FOREIGN KEY ("poolId", "chain") REFERENCES "PrismaPool"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaUserStakedBalance" ADD CONSTRAINT "PrismaUserStakedBalance_stakingId_chain_fkey" FOREIGN KEY ("stakingId", "chain") REFERENCES "PrismaPoolStaking"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrismaVotingGauge" ADD CONSTRAINT "PrismaVotingGauge_stakingGaugeId_chain_fkey" FOREIGN KEY ("stakingGaugeId", "chain") REFERENCES "PrismaPoolStakingGauge"("id", "chain") ON DELETE CASCADE ON UPDATE CASCADE;
