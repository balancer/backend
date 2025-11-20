import { poolService } from '../../../../modules/pool/pool.service';
import { PoolAggregatorLoader } from '../../../../modules/pool/lib/pool-aggregator-loader';
import { GqlChain, Resolvers } from '../generated-schema';
import { isAdminRoute } from '../../../../modules/auth/auth-context';
import { networkContext } from '../../../../modules/network/network-context.service';
import { headerChain } from '../../../../modules/context/header-chain';
import {
    CowAmmController,
    EventsQueryController,
    SnapshotsController,
    PoolController,
    FXPoolsController,
} from '../../../../modules/controllers';
import { chainIdToChain } from '../../../../modules/network/chain-id-to-chain';
import { GraphQLError } from 'graphql';
import { upsertLastSyncedBlock } from '../../../../modules/actions/last-synced-block';
import { PrismaLastBlockSyncedCategory } from '@prisma/client';
import graphqlFields from 'graphql-fields';
import { AprsController } from '../../../../modules/controllers/aprs-controller';

const balancerResolvers: Resolvers = {
    Query: {
        poolGetPool: async (parent, { id, chain, userAddress }, context, info) => {
            const fields = graphqlFields(info);
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new GraphQLError('Provide "chain" param', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }
            return poolService.getGqlPool(fields, id, chain, userAddress ? userAddress : undefined);
        },
        poolGetPools: async (parent, args, context) => {
            return poolService.getGqlPools(args);
        },
        aggregatorPools: async (parent, args, context) => {
            const loader = new PoolAggregatorLoader();
            const pools = loader.aggregatorPools(args);
            return pools;
        },
        poolGetAggregatorPools: async (parent, args, context) => {
            const loader = new PoolAggregatorLoader();
            const pools = loader.aggregatorPools(args);
            return pools;
        },
        poolGetPoolsCount: async (parent, args, context) => {
            return poolService.getPoolsCount(args);
        },
        poolEvents: async (parent: any, { first, skip, where }) => {
            return EventsQueryController().getEvents({
                first,
                skip,
                where,
            });
        },
        poolGetFeaturedPools: async (parent, { chains }, context) => {
            return poolService.getFeaturedPools(chains);
        },
        poolGetSnapshots: async (parent, { id, chain, range }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new GraphQLError('Provide "chain" param', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }
            const snapshots = await poolService.getSnapshotsForPool(id, chain, range);

            return snapshots.map((snapshot) => ({
                ...snapshot,
                totalLiquidity: `${snapshot.totalLiquidity}`,
                sharePrice: `${snapshot.sharePrice}`,
                volume24h: `${snapshot.volume24h}`,
                fees24h: `${snapshot.fees24h}`,
                surplus24h: `${snapshot.surplus24h}`,
                swapsCount: `${snapshot.swapsCount}`,
                // fill deprecated fields with empty arrays/strings
                totalSwapVolume: `0`,
                totalSwapFee: `0`,
                totalSurplus: `0`,
                holdersCount: `0`,
            }));
        },
    },
    Mutation: {
        poolSyncAllPoolsFromSubgraph: async (parent, {}, context) => {
            isAdminRoute(context);

            const chain = headerChain();

            if (!chain) {
                throw new GraphQLError('Provide "chainId" header', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }

            return PoolController().addPoolsV2(chain);
        },
        poolReloadAllPoolAprs: async (parent, { chain }, context) => {
            isAdminRoute(context);

            await AprsController().reloadAprsAndIncentivizedCategory(chain);

            return 'success';
        },
        poolReloadStakingForAllPools: async (parent, args, context) => {
            isAdminRoute(context);

            const currentChain = headerChain();
            if (!currentChain) {
                throw new GraphQLError('Provide "chainId" header', {
                    extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
                });
            }

            await poolService.reloadStakingForAllPools(args.stakingTypes, currentChain);

            return 'success';
        },
        poolLoadSnapshotsForPools: async (parent, { poolId, chain }, context) => {
            isAdminRoute(context);

            await SnapshotsController().reloadSnapshotsForPool(poolId, chain);

            return 'success';
        },
        poolLoadOnChainDataForAllPools: async (parent, { chains }, context) => {
            isAdminRoute(context);
            const result: { type: string; chain: GqlChain; success: boolean; error: string | undefined }[] = [];

            for (const chain of chains) {
                try {
                    await PoolController().syncOnchainDataForAllPoolsV2(chain);
                    result.push({ type: 'v2', chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ type: 'v2', chain, success: false, error: `${e}` });
                    console.log(`Could not sync v2 pools for chain ${chain}: ${e}`);
                }
                try {
                    await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.POOLS_V3, 0);
                    await PoolController().syncPoolsV3(chain);
                    result.push({ type: 'v3', chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ type: 'v3', chain, success: false, error: `${e}` });
                    console.log(`Could not sync v3 pools for chain ${chain}: ${e}`);
                }
            }
            return result;
        },
        poolReloadPools: async (parent, { chains }, context) => {
            isAdminRoute(context);

            const result: { type: string; chain: GqlChain; success: boolean; error: string | undefined }[] = [];

            for (const chain of chains) {
                try {
                    await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.ADD_POOLS_V3, 0);
                    await PoolController().addPoolsV3(chain, false);
                    result.push({ type: 'v3', chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ type: 'v3', chain, success: false, error: `${e}` });
                    console.log(`Could not reload v3 pools for chain ${chain}: ${e}`);
                }
                try {
                    await upsertLastSyncedBlock(chain, PrismaLastBlockSyncedCategory.COW_AMM_POOLS, 0);
                    await CowAmmController().syncPools(chain);
                    result.push({ type: 'cow', chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ type: 'cow', chain, success: false, error: `${e}` });
                    console.log(`Could not reload COW pools for chain ${chain}: ${e}`);
                }
            }

            return result;
        },
        poolSyncFxQuoteTokens: async (parent, { chains }, context) => {
            isAdminRoute(context);

            const result: { type: string; chain: GqlChain; success: boolean; error: string | undefined }[] = [];

            for (const chain of chains) {
                try {
                    await FXPoolsController().syncQuoteTokens(chain);
                    result.push({ type: 'fx', chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ type: 'fx', chain, success: false, error: `${e}` });
                    console.log(`Could not sync fx quote tokens for chain ${chain}: ${e}`);
                }
            }

            return result;
        },
    },
};

export default balancerResolvers;
