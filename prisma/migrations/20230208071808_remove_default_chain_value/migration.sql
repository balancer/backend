-- AlterTable
ALTER TABLE "PrismaPool" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolAprItem" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolAprRange" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolBatchSwap" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolCategory" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolElementData" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolExpandedTokens" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolFilter" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolFilterMap" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolLinearData" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolLinearDynamicData" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolSnapshot" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolStableDynamicData" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolStaking" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolStakingGauge" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolStakingGaugeReward" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolStakingMasterChefFarm" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolStakingMasterChefFarmRewarder" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolStakingReliquaryFarmLevel" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolSwap" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolToken" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaPoolTokenDynamicData" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaReliquaryFarmSnapshot" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaReliquaryLevelSnapshot" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaReliquaryTokenBalanceSnapshot" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaToken" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaTokenCurrentPrice" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaTokenDynamicData" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaTokenPrice" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaTokenType" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaUserBalanceSyncStatus" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaUserPoolBalanceSnapshot" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaUserRelicSnapshot" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaUserStakedBalance" ALTER COLUMN "chain" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PrismaUserWalletBalance" ALTER COLUMN "chain" DROP DEFAULT;
