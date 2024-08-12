import { poolService } from './pool.service';
import { GqlChain, Resolvers } from '../../schema';
import { isAdminRoute } from '../auth/auth-context';
import { prisma } from '../../prisma/prisma-client';
import { networkContext } from '../network/network-context.service';
import { headerChain } from '../context/header-chain';
import { CowAmmController, EventsQueryController, PoolController, SnapshotsController } from '../controllers';
import { chainToIdMap } from '../network/network-config';

const balancerResolvers: Resolvers = {
    Query: {
        poolGetPool: async (parent, { id, chain, userAddress }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('poolGetPool error: Provide "chain" param');
            }
            return poolService.getGqlPool(id, chain, userAddress ? userAddress : undefined);
        },
        poolGetPools: async (parent, args, context) => {
            return poolService.getGqlPools(args);
        },
        poolGetPoolsCount: async (parent, args, context) => {
            return poolService.getPoolsCount(args);
        },
        // TODO: Deprecate in favor of poolGetEvents
        poolGetSwaps: async (parent, args, context) => {
            const currentChain = headerChain();
            if (!args.where?.chainIn && currentChain) {
                args.where = { ...args.where, chainIn: [currentChain] };
            } else if (!args.where?.chainIn) {
                throw new Error('poolGetSwaps error: Provide "where.chainIn" param');
            }
            return poolService.getPoolSwaps(args);
        },
        // TODO: Deprecate in favor of poolGetEvents
        poolGetBatchSwaps: async (parent, args, context) => {
            const currentChain = headerChain();
            if (!args.where?.chainIn && currentChain) {
                args.where = { ...args.where, chainIn: [currentChain] };
            } else if (!args.where?.chainIn) {
                throw new Error('poolGetBatchSwaps error: Provide "where.chainIn" param');
            }
            return poolService.getPoolBatchSwaps(args);
        },
        // TODO: Deprecate in favor of poolGetEvents
        poolGetJoinExits: async (parent, args, context) => {
            const currentChain = headerChain();
            if (!args.where?.chainIn && currentChain) {
                args.where = { ...args.where, chainIn: [currentChain] };
            } else if (!args.where?.chainIn) {
                throw new Error('poolGetJoinExits error: Provide "where.chainIn" param');
            }
            return poolService.getPoolJoinExits(args);
        },
        poolGetEvents: (parent, { range, poolId, chain, typeIn, userAddress }, context) => {
            return EventsQueryController().getEvents({
                first: 1000,
                where: { range, poolIdIn: [poolId], chainIn: [chain], typeIn, userAddress },
            });
        },
        poolEvents: (parent, { first, skip, where }, context) => {
            return EventsQueryController().getEvents({
                first,
                skip,
                where,
            });
        },
        poolGetFeaturedPoolGroups: async (parent, { chains }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new Error('poolGetFeaturedPoolGroups error: Provide "chains" param');
            }
            return poolService.getFeaturedPoolGroups(chains);
        },
        poolGetFeaturedPools: async (parent, { chains }, context) => {
            return poolService.getFeaturedPools(chains);
        },
        poolGetSnapshots: async (parent, { id, chain, range }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('poolGetSnapshots error: Provide "chain" param');
            }
            const snapshots = await poolService.getSnapshotsForPool(id, chain, range);

            return snapshots.map((snapshot) => ({
                ...snapshot,
                totalLiquidity: `${snapshot.totalLiquidity}`,
                sharePrice: `${snapshot.sharePrice}`,
                volume24h: `${snapshot.volume24h}`,
                fees24h: `${snapshot.fees24h}`,
                surplus24h: `${snapshot.surplus24h}`,
                totalSwapVolume: `${snapshot.totalSwapVolume}`,
                totalSwapFee: `${snapshot.totalSwapFee}`,
                totalSurplus: `${snapshot.totalSurplus}`,
                swapsCount: `${snapshot.swapsCount}`,
                holdersCount: `${snapshot.holdersCount}`,
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
        poolUpdateAprs: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await poolService.updatePoolAprs(chain);

            return 'success';
        },
        poolSyncPoolAllTokensRelationship: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.syncPoolAllTokensRelationship();

            return 'success';
        },
        poolReloadAllPoolAprs: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await poolService.reloadAllPoolAprs(chain);

            return 'success';
        },
        poolSyncTotalShares: async (parent, {}, context) => {
            isAdminRoute(context);

            const items = await prisma.prismaPoolDynamicData.findMany({ where: { chain: networkContext.chain } });

            for (const item of items) {
                await prisma.prismaPoolDynamicData.update({
                    where: { id_chain: { id: item.id, chain: networkContext.chain } },
                    data: { totalSharesNum: parseFloat(item.totalShares) },
                });
            }

            return 'success';
        },
        poolReloadStakingForAllPools: async (parent, args, context) => {
            isAdminRoute(context);

            const currentChain = headerChain();
            if (!currentChain) {
                throw new Error('poolReloadStakingForAllPools error: Provide chain header');
            }

            await poolService.reloadStakingForAllPools(args.stakingTypes, currentChain);

            return 'success';
        },
        poolSyncStakingForPools: async (parent, args, context) => {
            isAdminRoute(context);
            const currentChain = headerChain();
            if (!currentChain) {
                throw new Error('poolSyncStakingForPools error: Provide chain header');
            }

            await poolService.syncStakingForPools([currentChain]);

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
        poolLoadSnapshotsForPools: async (parent, { poolIds, reload }, context) => {
            isAdminRoute(context);

            await SnapshotsController().syncSnapshotForPools(poolIds, networkContext.chainId);

            return 'success';
        },
        poolSyncLatestSnapshotsForAllPools: async (parent, { chain }, context) => {
            isAdminRoute(context);
            const chainId = chainToIdMap[chain];

            await SnapshotsController().syncSnapshotsV2(chainId);

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
        poolInitOnChainDataForAllPools: async (parent, args, context) => {
            isAdminRoute(context);

            await poolService.initOnChainDataForAllPools();

            return 'success';
        },

        poolSyncPool: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            const latestBlockNumber = await networkContext.provider.getBlockNumber();
            await poolService.updateOnChainDataForPools([poolId], latestBlockNumber);

            return 'success';
        },
        poolReloadAllTokenNestedPoolIds: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.reloadAllTokenNestedPoolIds();

            return 'success';
        },
        poolDeletePool: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            await poolService.deletePool(poolId);

            return 'success';
        },
        poolReloadPools: async (parent, { chains }, context) => {
            isAdminRoute(context);

            const result: { type: string; chain: GqlChain; success: boolean; error: string | undefined }[] = [];

            for (const chain of chains) {
                try {
                    await PoolController().reloadPoolsV3(chain);
                    result.push({ type: 'v3', chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ type: 'v3', chain, success: false, error: `${e}` });
                    console.log(`Could not reload v3 pools for chain ${chain}: ${e}`);
                }
                try {
                    await CowAmmController().reloadPools(chain);
                    result.push({ type: 'cow', chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ type: 'cow', chain, success: false, error: `${e}` });
                    console.log(`Could not reload COW pools for chain ${chain}: ${e}`);
                }
            }

            return result;
        },
        poolSyncAllCowSnapshots: async (parent, { chains }, context) => {
            isAdminRoute(context);

            const result: { type: string; chain: GqlChain; success: boolean; error: string | undefined }[] = [];

            for (const chain of chains) {
                try {
                    await CowAmmController().syncAllSnapshots(chainToIdMap[chain]);
                    result.push({ type: 'cow', chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ type: 'cow', chain, success: false, error: `${e}` });
                    console.log(`Could not sync cow amm snapshots for chain ${chain}: ${e}`);
                }
            }

            return result;
        },
    },
};

export default balancerResolvers;
