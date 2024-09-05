import {
    Balancer,
    BalancerAmpUpdateFragment,
    BalancerAmpUpdatesQueryVariables,
    BalancerGradualWeightUpdateFragment,
    BalancerGradualWeightUpdatesQueryVariables,
    BalancerJoinExitsQuery,
    BalancerJoinExitsQueryVariables,
    BalancerLatestPriceFragment,
    BalancerLatestPricesQuery,
    BalancerLatestPricesQueryVariables,
    BalancerPoolFragment,
    BalancerPoolQuery,
    BalancerPoolQueryVariables,
    BalancerPoolShareFragment,
    BalancerPoolSharesQueryVariables,
    BalancerPoolSnapshotFragment,
    BalancerPoolSnapshotsQuery,
    BalancerPoolSnapshotsQueryVariables,
    BalancerPoolsQuery,
    BalancerPoolsQueryVariables,
    BalancerPortfolioDataQuery,
    BalancerPortfolioPoolsDataQuery,
    BalancerProtocolDataQueryVariables,
    BalancerSwapFragment,
    BalancerSwapsQuery,
    BalancerSwapsQueryVariables,
    BalancerTokenPriceFragment,
    BalancerTokenPricesQuery,
    BalancerTokenPricesQueryVariables,
    BalancerTokensQuery,
    BalancerTokensQueryVariables,
    BalancerTradePairSnapshotsQuery,
    BalancerTradePairSnapshotsQueryVariables,
    BalancerUserFragment,
    BalancerUsersQueryVariables,
    getSdk,
    OrderDirection,
    Pool_OrderBy,
    PoolBalancesFragment,
    PoolBalancesQueryVariables,
    PoolShare_OrderBy,
    PoolSnapshot_OrderBy,
    Swap_OrderBy,
} from './generated/balancer-subgraph-types';
import { subgraphLoadAll } from '../subgraph-util';
import { fiveMinutesInMs, twentyFourHoursInMs } from '../../common/time';
import { BalancerUserPoolShare } from './balancer-subgraph-types';
import { SubgraphServiceBase } from '../../sources/subgraphs/subgraph-service-base';
import { Prisma } from '@prisma/client';
import { chainIdToChain } from '../../network/chain-id-to-chain';

const ALL_POOLS_CACHE_KEY = `balance-subgraph_all-pools`;
const PORTFOLIO_POOLS_CACHE_KEY = `balance-subgraph_portfolio-pools`;

export class BalancerSubgraphService extends SubgraphServiceBase<ReturnType<typeof getSdk>> {
    constructor(subgraphUrl: string | string[], chainId: number) {
        super(subgraphUrl, chainId, getSdk);
    }

    public async getMetadata() {
        return this.retryOnFailure(async (sdk) => {
            const { meta } = await sdk.BalancerGetMeta();
            if (!meta) {
                throw new Error('Missing meta data');
            }
            return meta;
        });
    }

    public async getProtocolData(args: BalancerProtocolDataQueryVariables): Promise<Balancer> {
        return this.retryOnFailure(async (sdk) => {
            const { balancers } = await sdk.BalancerProtocolData(args);
            if (balancers.length === 0) {
                throw new Error('Missing protocol data');
            }
            return balancers[0] as Balancer;
        });
    }

    public async getTokenPrices(args: BalancerTokenPricesQueryVariables): Promise<BalancerTokenPricesQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerTokenPrices(args);
        });
    }

    public async getTokens(args: BalancerTokensQueryVariables): Promise<BalancerTokensQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerTokens(args);
        });
    }

    public async getPoolSnapshots(args: BalancerPoolSnapshotsQueryVariables): Promise<BalancerPoolSnapshotsQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerPoolSnapshots(args);
        });
    }

    public async getAllPoolSnapshots(
        args: BalancerPoolSnapshotsQueryVariables,
    ): Promise<BalancerPoolSnapshotFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            return subgraphLoadAll<BalancerPoolSnapshotFragment>(sdk.BalancerPoolSnapshots, 'poolSnapshots', args);
        });
    }

    public async getPools(args: BalancerPoolsQueryVariables): Promise<BalancerPoolsQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerPools(args);
        });
    }

    public async getSwaps(args: BalancerSwapsQueryVariables): Promise<BalancerSwapsQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerSwaps(args);
        });
    }

    public async getAllSwaps(args: BalancerSwapsQueryVariables): Promise<BalancerSwapFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            return subgraphLoadAll<BalancerSwapFragment>(sdk.BalancerSwaps, 'swaps', args);
        });
    }

    public async getAllSwapsWithPaging({
        where,
        block,
        startTimestamp,
    }: Pick<BalancerSwapsQueryVariables, 'where' | 'block'> & { startTimestamp: number }): Promise<
        BalancerSwapFragment[]
    > {
        return this.retryOnFailure(async (sdk) => {
            const limit = 1000;
            let timestamp = startTimestamp;
            let hasMore = true;
            let swaps: BalancerSwapFragment[] = [];

            while (hasMore) {
                const response = await sdk.BalancerSwaps({
                    where: { ...where, timestamp_gt: timestamp },
                    block,
                    orderBy: Swap_OrderBy.Timestamp,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                });

                swaps = [...swaps, ...response.swaps];
                if (response.swaps.length < limit) {
                    hasMore = false;
                } else {
                    timestamp = response.swaps[response.swaps.length - 1].timestamp;
                }
            }

            return swaps;
        });
    }

    public async getAllGradualWeightUpdates(
        args: BalancerGradualWeightUpdatesQueryVariables,
    ): Promise<BalancerGradualWeightUpdateFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            return subgraphLoadAll<BalancerGradualWeightUpdateFragment>(
                sdk.BalancerGradualWeightUpdates,
                'gradualWeightUpdates',
                args,
            );
        });
    }

    public async getAllAmpUpdates(args: BalancerAmpUpdatesQueryVariables): Promise<BalancerAmpUpdateFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            return subgraphLoadAll<BalancerAmpUpdateFragment>(sdk.BalancerAmpUpdates, 'ampUpdates', args);
        });
    }

    public async getPool(args: BalancerPoolQueryVariables): Promise<BalancerPoolQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerPool(args);
        });
    }

    public async getPortfolioData(id: string, previousBlockNumber: number): Promise<BalancerPortfolioDataQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerPortfolioData({ id, previousBlockNumber });
        });
    }

    public async getUser(userAddress: string): Promise<BalancerUserFragment | null> {
        return this.retryOnFailure(async (sdk) => {
            const { users } = await sdk.BalancerUsers({ where: { id: userAddress.toLowerCase() }, first: 1 });
            if (users.length === 0) {
                return null;
            }
            return this.normalizeBalancerUser(users[0]);
        });
    }

    public async getAllUsers(args: BalancerUsersQueryVariables): Promise<BalancerUserFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            const users = await subgraphLoadAll<BalancerUserFragment>(sdk.BalancerUsers, 'users', args);
            return users.map((user) => this.normalizeBalancerUser(user));
        });
    }

    public async getPoolShares(args: BalancerPoolSharesQueryVariables): Promise<BalancerUserPoolShare[]> {
        return this.retryOnFailure(async (sdk) => {
            const { poolShares } = await sdk.BalancerPoolShares(args);
            return poolShares.map((shares) => ({
                ...shares,
                balance: parseFloat(shares.balance) < 0 ? '0' : shares.balance,
                poolId: shares.poolId.id,
                poolAddress: shares.id.split('-')[0],
                userAddress: shares.id.split('-')[1],
            }));
        });
    }

    public async getAllPoolSharesWithBalance(
        poolIds: string[],
        excludedAddresses: string[],
    ): Promise<Prisma.PrismaUserWalletBalanceCreateManyInput[]> {
        return this.retryOnFailure(async (sdk) => {
            const allPoolShares: BalancerPoolShareFragment[] = [];
            let hasMore = true;
            let id = `0`;
            const pageSize = 1000;

            while (hasMore) {
                const shares = await sdk.BalancerPoolShares({
                    where: {
                        id_gt: id,
                        poolId_in: poolIds.length > 0 ? poolIds : undefined,
                        userAddress_not_in: excludedAddresses,
                        balance_gt: '0',
                    },
                    orderBy: PoolShare_OrderBy.Id,
                    orderDirection: OrderDirection.Asc,
                    first: pageSize,
                });

                if (shares.poolShares.length === 0) {
                    break;
                }

                if (shares.poolShares.length < pageSize) {
                    hasMore = false;
                }

                allPoolShares.push(...shares.poolShares);
                id = shares.poolShares[shares.poolShares.length - 1].id;
            }

            return allPoolShares.map((shares) => ({
                ...shares,
                poolId: shares.poolId.id.toLowerCase(),
                chain: chainIdToChain[this.chainId],
                //ensure the user balance isn't negative, unsure how the subgraph ever allows this to happen
                balance: parseFloat(shares.balance) < 0 ? '0' : shares.balance,
                balanceNum: Math.max(0, parseFloat(shares.balance)),
                tokenAddress: shares.id.toLowerCase().split('-')[0],
                userAddress: shares.id.toLowerCase().split('-')[1],
            }));
        });
    }

    public async getLatestPrices(args: BalancerLatestPricesQueryVariables): Promise<BalancerLatestPricesQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerLatestPrices(args);
        });
    }

    public async getLatestPrice(id: string): Promise<BalancerLatestPriceFragment | null> {
        return this.retryOnFailure(async (sdk) => {
            const { latestPrice } = await sdk.BalancerLatestPrice({ id });
            return latestPrice || null;
        });
    }

    public async getAllTokenPrices(args: BalancerTokenPricesQueryVariables): Promise<BalancerTokenPriceFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            return subgraphLoadAll<BalancerTokenPriceFragment>(sdk.BalancerTokenPrices, 'tokenPrices', args);
        });
    }

    public async getAllPools(
        args: BalancerPoolsQueryVariables,
        applyTotalSharesFilter = true,
    ): Promise<BalancerPoolFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            return subgraphLoadAll<BalancerPoolFragment>(sdk.BalancerPools, 'pools', {
                ...args,
                where: {
                    totalShares_not: applyTotalSharesFilter ? '0.00000000001' : undefined,
                    poolType_not_contains_nocase: 'linear',
                    ...args.where,
                },
            });
        });
    }

    public async getPoolJoinExits(args: BalancerJoinExitsQueryVariables): Promise<BalancerJoinExitsQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerJoinExits(args);
        });
    }

    public async getPortfolioPoolsData(previousBlockNumber: number): Promise<BalancerPortfolioPoolsDataQuery> {
        return this.retryOnFailure(async (sdk) => {
            const cached = this.cache.get(
                `${PORTFOLIO_POOLS_CACHE_KEY}:${this.chainId}`,
            ) as BalancerPortfolioPoolsDataQuery | null;

            if (cached) {
                return cached;
            }

            const portfolioPools = await sdk.BalancerPortfolioPoolsData({ previousBlockNumber });
            this.cache.put(`${PORTFOLIO_POOLS_CACHE_KEY}:${this.chainId}`, portfolioPools, fiveMinutesInMs);

            return portfolioPools;
        });
    }

    public async getAllPoolsAtBlock(block: number): Promise<BalancerPoolFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            const cached = this.cache.get(`${ALL_POOLS_CACHE_KEY}:${this.chainId}:${block}`) as
                | BalancerPoolFragment[]
                | null;

            if (cached) {
                return cached;
            }

            const { pools } = await sdk.BalancerPools({
                first: 1000,
                where: { totalShares_gt: '0' },
                block: { number: block },
            });

            this.cache.put(`${ALL_POOLS_CACHE_KEY}:${this.chainId}:${block}`, pools, twentyFourHoursInMs);
            return pools;
        });
    }

    public async getTradePairSnapshots(
        args: BalancerTradePairSnapshotsQueryVariables,
    ): Promise<BalancerTradePairSnapshotsQuery> {
        return this.retryOnFailure(async (sdk) => {
            return sdk.BalancerTradePairSnapshots(args);
        });
    }

    public async getPoolsWithActiveUpdates(timestamp: number): Promise<string[]> {
        return this.retryOnFailure(async (sdk) => {
            const { ampUpdates, gradualWeightUpdates } = await sdk.BalancerGetPoolsWithActiveUpdates({
                timestamp: `${timestamp}`,
            });

            return [...ampUpdates, ...gradualWeightUpdates].map((item) => item.poolId.id);
        });
    }

    public async getSnapshotsForTimestamp(timestamp: number): Promise<BalancerPoolSnapshotFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            const limit = 1000;
            let hasMore = true;
            let id = `0x`;
            let snapshots: BalancerPoolSnapshotFragment[] = [];

            while (hasMore) {
                const response = await sdk.BalancerPoolSnapshots({
                    where: { timestamp, id_gt: id },
                    orderBy: PoolSnapshot_OrderBy.Id,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                });

                snapshots = [...snapshots, ...response.poolSnapshots];

                if (response.poolSnapshots.length < limit) {
                    hasMore = false;
                } else {
                    id = snapshots[snapshots.length - 1].id;
                }
            }

            return snapshots;
        });
    }

    public async getAllPoolBalances({ where, block }: PoolBalancesQueryVariables): Promise<PoolBalancesFragment[]> {
        return this.retryOnFailure(async (sdk) => {
            const limit = 1000;
            let hasMore = true;
            let id = `0x`;
            let data: PoolBalancesFragment[] = [];

            while (hasMore) {
                const response = await sdk.PoolBalances({
                    where: { ...where, id_gt: id },
                    orderBy: Pool_OrderBy.Id,
                    orderDirection: OrderDirection.Asc,
                    first: limit,
                    block,
                });

                data = [...data, ...response.pools];

                if (response.pools.length < limit) {
                    hasMore = false;
                } else {
                    id = response.pools[response.pools.length - 1].id;
                }
            }

            return data;
        });
    }

    private normalizeBalancerUser(user: BalancerUserFragment): BalancerUserFragment {
        return {
            ...user,
            sharesOwned: user.sharesOwned?.map((shares) => ({
                ...shares,
                //ensure the user balance isn't negative, unsure how the subgraph ever allows this to happen
                balance: parseFloat(shares.balance) < 0 ? '0' : shares.balance,
            })),
        };
    }
}
