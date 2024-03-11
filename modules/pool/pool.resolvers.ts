import { poolService } from './pool.service';
import { GqlPoolJoinExit, GqlPoolSwap, Resolvers } from '../../schema';
import { isAdminRoute } from '../auth/auth-context';
import { prisma } from '../../prisma/prisma-client';
import { networkContext } from '../network/network-context.service';
import { headerChain } from '../context/header-chain';
import { QueriesController } from '../controllers/queries-controller';

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
        poolGetSwaps: (parent, args, context) => {
            const currentChain = headerChain();
            if (!args.where?.chainIn && currentChain) {
                args.where = { ...args.where, chainIn: [currentChain] };
            } else if (!args.where?.chainIn) {
                throw new Error('poolGetSwaps error: Provide "where.chainIn" param');
            }
            return QueriesController().getEvents({ ...args, where: { ...args.where, typeIn: ['SWAP'] } }) as Promise<
                GqlPoolSwap[]
            >;
        },
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
        poolGetJoinExits: (parent, args, context) => {
            return QueriesController().getEvents({
                ...args,
                where: { ...args.where, typeIn: ['JOIN', 'EXIT'] },
            }) as Promise<GqlPoolJoinExit[]>;
        },
        poolGetEvents: (parent, args, context) => {
            return QueriesController().getEvents(args);
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
                totalSwapVolume: `${snapshot.totalSwapVolume}`,
                totalSwapFee: `${snapshot.totalSwapFee}`,
                swapsCount: `${snapshot.swapsCount}`,
                holdersCount: `${snapshot.holdersCount}`,
            }));
        },
        poolGetLinearPools: async (parent, { chains }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new Error('poolGetLinearPools error: Provide "chains" param');
            }
            return poolService.getGqlLinearPools(chains);
        },
        poolGetGyroPools: async (parent, { chains }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new Error('poolGetGyroPools error: Provide "chains" param');
            }
            return poolService.getGqlGyroPools(chains);
        },
        poolGetFxPools: async (parent, { chains }) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new Error('poolGetFxPools error: Provide "chains" param');
            }
            return poolService.getGqlFxPools(chains);
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

            await poolService.syncPoolContentData();

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
        poolLoadSnapshotsForPools: async (parent, { poolIds, reload }, context) => {
            isAdminRoute(context);

            await poolService.loadSnapshotsForPools(poolIds, reload || false);

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
        poolSetPoolsWithPreferredGaugesAsIncentivized: async (parent, {}, context) => {
            isAdminRoute(context);

            await poolService.setPoolsWithPreferredGaugesAsIncentivized();

            return 'success';
        },
        poolBlackListAddPool: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            await poolService.addToBlackList(poolId);

            return 'success';
        },
        poolBlackListRemovePool: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            await poolService.removeFromBlackList(poolId);

            return 'success';
        },
        poolDeletePool: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            await poolService.deletePool(poolId);

            return 'success';
        },
    },
};

export default balancerResolvers;
