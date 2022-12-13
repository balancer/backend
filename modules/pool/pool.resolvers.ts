import { poolService } from './pool.service';
import { Resolvers } from '../../schema';
import { isAdminRoute } from '../auth/auth-context';
import { prisma } from '../../prisma/prisma-client';
import { jsonRpcProvider } from '../web3/contract';

const balancerResolvers: Resolvers = {
    Query: {
        poolGetPool: async (parent, { id }, context) => {
            return poolService.getGqlPool(id);
        },
        poolGetPools: async (parent, args, context) => {
            return poolService.getGqlPools(args);
        },
        poolGetPoolsCount: async (parent, args, context) => {
            return poolService.getPoolsCount(args);
        },
        poolGetPoolFilters: async (parent, {}, context) => {
            return poolService.getPoolFilters();
        },
        poolGetSwaps: async (parent, args, context) => {
            return poolService.getPoolSwaps(args);
        },
        poolGetBatchSwaps: async (parent, args, context) => {
            return poolService.getPoolBatchSwaps(args);
        },
        poolGetJoinExits: async (parent, args, context) => {
            return poolService.getPoolJoinExits(args);
        },
        poolGetUserSwapVolume: async (parent, args, context) => {
            return poolService.getPoolUserSwapVolume(args);
        },
        poolGetFeaturedPoolGroups: async (parent, args, context) => {
            return poolService.getFeaturedPoolGroups();
        },
        poolGetSnapshots: async (parent, { id, range }, context) => {
            const snapshots = await poolService.getSnapshotsForPool(id, range);

            return snapshots.map((snapshot) => ({
                ...snapshot,
                totalLiquidity: `${snapshot.totalLiquidity}`,
                sharePrice: `${snapshot.sharePrice}`,
                volume24h: `${snapshot.volume24h}`,
                fees24h: `${snapshot.fees24h}`,
                totalSwapVolume: `${snapshot.totalSwapVolume}`,
                totalSwapFee: `${snapshot.totalSwapFee}`,
                swapsCount: `${snapshot.swapsCount}`,
                holdersCount: `${snapshot.holdersCount}`,
            }));
        },
        poolGetAllPoolsSnapshots: async (parent, { range }, context) => {
            const snapshots = await poolService.getSnapshotsForAllPools(range);

            return snapshots.map((snapshot) => ({
                ...snapshot,
                totalLiquidity: `${snapshot.totalLiquidity}`,
                sharePrice: `${snapshot.sharePrice}`,
                volume24h: `${snapshot.volume24h}`,
                fees24h: `${snapshot.fees24h}`,
                totalSwapVolume: `${snapshot.totalSwapVolume}`,
                totalSwapFee: `${snapshot.totalSwapFee}`,
                swapsCount: `${snapshot.swapsCount}`,
                holdersCount: `${snapshot.holdersCount}`,
            }));
        },
        poolGetLinearPools: async () => {
            return poolService.getGqlLinearPools();
        },
        poolGetReliquaryFarmSnapshots: async (parent, { id, range }, context) => {
            const snapshots = await poolService.getSnapshotsForReliquaryFarm(parseFloat(id), range);

            return snapshots.map((snapshot) => ({
                id: snapshot.id,
                farmId: snapshot.farmId,
                timestamp: snapshot.timestamp,
                relicCount: `${snapshot.relicCount}`,
                userCount: `${snapshot.userCount}`,
                totalBalance: snapshot.totalBalance,
                dailyDeposited: snapshot.dailyDeposited,
                dailyWithdrawn: snapshot.dailyWithdrawn,
                levelBalances: snapshot.levelBalances,
            }));
        },
    },
    Mutation: {
        poolSyncAllPoolsFromSubgraph: async (parent, {}, context) => {
            isAdminRoute(context);

            return poolService.syncAllPoolsFromSubgraph();
        },
        poolSyncNewPoolsFromSubgraph: async (parent, {}, context) => {
            isAdminRoute(context);

            return poolService.syncNewPoolsFromSubgraph();
        },
        poolLoadOnChainDataForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.loadOnChainDataForAllPools();

            return 'success';
        },
        poolUpdateLiquidityValuesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.updateLiquidityValuesForPools();

            return 'success';
        },
        poolUpdateVolumeAndFeeValuesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.updateVolumeAndFeeValuesForPools();

            return 'success';
        },
        poolSyncSwapsForLast48Hours: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.syncSwapsForLast48Hours();

            return 'success';
        },
        poolLoadOnChainDataForPoolsWithActiveUpdates: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.loadOnChainDataForPoolsWithActiveUpdates();

            return 'success';
        },
        poolSyncSanityPoolData: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.syncSanityPoolData();

            return 'success';
        },
        poolUpdateAprs: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.updatePoolAprs();

            return 'success';
        },
        poolSyncPoolAllTokensRelationship: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.syncPoolAllTokensRelationship();

            return 'success';
        },
        poolReloadAllPoolAprs: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.realodAllPoolAprs();

            return 'success';
        },
        poolSyncTotalShares: async (parent, {}, context) => {
            isAdminRoute(context);

            const items = await prisma.prismaPoolDynamicData.findMany({});

            for (const item of items) {
                await prisma.prismaPoolDynamicData.update({
                    where: { id: item.id },
                    data: { totalSharesNum: parseFloat(item.totalShares) },
                });
            }

            return 'success';
        },
        poolReloadStakingForAllPools: async (parent, args, context) => {
            isAdminRoute(context);

            await poolService.reloadStakingForAllPools(args.stakingTypes);

            return 'success';
        },
        poolSyncStakingForPools: async (parent, args, context) => {
            isAdminRoute(context);

            await poolService.syncStakingForPools();

            return 'success';
        },
        poolUpdateLiquidity24hAgoForAllPools: async (parent, args, context) => {
            isAdminRoute(context);

            await poolService.updateLiquidity24hAgoForAllPools();

            return 'success';
        },
        poolLoadSnapshotsForAllPools: async (parent, args, context) => {
            isAdminRoute(context);

            await poolService.loadSnapshotsForAllPools();

            return 'success';
        },
        poolSyncLatestSnapshotsForAllPools: async (parent, { daysToSync }, context) => {
            isAdminRoute(context);

            await poolService.syncLatestSnapshotsForAllPools(daysToSync || undefined);

            return 'success';
        },
        poolUpdateLifetimeValuesForAllPools: async (parent, args, context) => {
            isAdminRoute(context);

            await poolService.updateLifetimeValuesForAllPools();

            return 'success';
        },
        poolInitializeSnapshotsForPool: async (parent, args, context) => {
            isAdminRoute(context);

            await poolService.createPoolSnapshotsForPoolsMissingSubgraphData(args.poolId);

            return 'success';
        },
        poolSyncPool: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            const latestBlockNumber = await jsonRpcProvider.getBlockNumber();
            await poolService.updateOnChainDataForPools([poolId], latestBlockNumber);

            return 'success';
        },
        poolReloadPoolNestedTokens: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            await poolService.reloadPoolNestedTokens(poolId);

            return 'success';
        },
        poolReloadAllTokenNestedPoolIds: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.reloadAllTokenNestedPoolIds();

            return 'success';
        },
        poolLoadReliquarySnapshotsForAllFarms: async (parent, args, context) => {
            isAdminRoute(context);

            await poolService.loadReliquarySnapshotsForAllFarms();

            return 'success';
        },
    },
};

export default balancerResolvers;
