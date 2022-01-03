import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import {
    BalancerLatestPriceFragment,
    BalancerPoolFragment,
    OrderDirection,
    Pool_OrderBy,
} from '../balancer-subgraph/generated/balancer-subgraph-types';
import { sanityClient } from '../sanity/sanity';
import { cache } from '../cache/cache';
import { blocksSubgraphService } from '../blocks-subgraph/blocks-subgraph.service';
import { getOnChainBalances } from './src/onchainData';
import { providers } from 'ethers';
import { env } from '../../app/env';
import { BALANCER_NETWORK_CONFIG } from './src/contracts';
import { GqlBalancerPoolSnapshot } from '../../schema';
import _ from 'lodash';
import { oneDayInMinutes } from '../util/time';

const POOLS_CACHE_KEY = 'pools:all';
const PAST_POOLS_CACHE_KEY = 'pools:24h';
const LATEST_PRICE_CACHE_KEY_PREFIX = 'pools:latestPrice:';
const POOL_SNAPSHOTS_CACHE_KEY_PREFIX = 'pools:snapshots:';
import { v4 as uuidv4 } from 'uuid';

export class BalancerService {
    constructor() {}

    public async getPools(): Promise<BalancerPoolFragment[]> {
        console.time('fetch pools from cache ' + uuidv4());
        const pools = await cache.getObjectValue<BalancerPoolFragment[]>(POOLS_CACHE_KEY);
        console.timeEnd('fetch pools from cache ' + uuidv4());

        if (pools) {
            console.log('return cached pools');
            return pools;
        }

        return [];
    }

    public async getPastPools(): Promise<BalancerPoolFragment[]> {
        const pools = await cache.getObjectValue<BalancerPoolFragment[]>(PAST_POOLS_CACHE_KEY);

        if (pools) {
            return pools;
        }

        return this.cachePastPools();
    }

    public async getLatestPrice(id: string): Promise<BalancerLatestPriceFragment | null> {
        const cached = await cache.getObjectValue<BalancerLatestPriceFragment>(`${LATEST_PRICE_CACHE_KEY_PREFIX}${id}`);

        if (cached) {
            return cached;
        }

        const latestPrice = await balancerSubgraphService.getLatestPrice(id);

        if (latestPrice) {
            await cache.putObjectValue(`${LATEST_PRICE_CACHE_KEY_PREFIX}${id}`, latestPrice);
        }

        return latestPrice;
    }

    public async cachePools(): Promise<BalancerPoolFragment[]> {
        const provider = new providers.JsonRpcProvider(env.RPC_URL);
        const blacklistedPools = await this.getBlacklistedPools();
        const pools = await balancerSubgraphService.getAllPools({
            orderBy: Pool_OrderBy.TotalLiquidity,
            orderDirection: OrderDirection.Desc,
        });

        const filtered = pools.filter((pool) => {
            if (blacklistedPools.includes(pool.id)) {
                return false;
            }

            if (parseFloat(pool.totalShares) < 0.01) {
                return false;
            }

            return true;
        });

        const filteredWithOnChainBalances = await getOnChainBalances(
            filtered,
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].multicall,
            BALANCER_NETWORK_CONFIG[`${env.CHAIN_ID}`].vault,
            provider,
        );

        await cache.putObjectValue(POOLS_CACHE_KEY, filteredWithOnChainBalances, 30);

        return filteredWithOnChainBalances;
    }

    public async cachePastPools(): Promise<BalancerPoolFragment[]> {
        const block = await blocksSubgraphService.getBlockFrom24HoursAgo();
        const blacklistedPools = await this.getBlacklistedPools();
        const pools = await balancerSubgraphService.getAllPools({
            orderBy: Pool_OrderBy.TotalLiquidity,
            orderDirection: OrderDirection.Desc,
            block: { number: parseInt(block.number) },
        });

        const filtered = pools.filter((pool) => {
            if (blacklistedPools.includes(pool.id)) {
                return false;
            }

            if (parseFloat(pool.totalShares) < 0.01) {
                return false;
            }

            return true;
        });

        await cache.putObjectValue(PAST_POOLS_CACHE_KEY, filtered, 30);

        return filtered;
    }

    public async getPoolSnapshots(poolId: string): Promise<GqlBalancerPoolSnapshot[]> {
        const snapshots: GqlBalancerPoolSnapshot[] = [];
        const blocks = await blocksSubgraphService.getDailyBlocks(60);

        const cached = await cache.getObjectValue<GqlBalancerPoolSnapshot[]>(
            `${POOL_SNAPSHOTS_CACHE_KEY_PREFIX}:${poolId}:${blocks[0].number}`,
        );

        if (cached) {
            return cached;
        }

        for (let i = 0; i < blocks.length - 1; i++) {
            const block = blocks[i];
            const previousBlock = blocks[i + 1];
            const blockNumber = parseInt(block.number);
            const pools = await balancerSubgraphService.getAllPoolsAtBlock(blockNumber);
            const previousPools = await balancerSubgraphService.getAllPoolsAtBlock(parseInt(previousBlock.number));

            const pool = pools.find((pool) => pool.id === poolId);
            const previousPool = previousPools.find((previousPool) => previousPool.id === poolId);

            if (!pool || !previousPool) {
                break;
            }

            const swapFees24h = parseFloat(pool.totalSwapFee) - parseFloat(previousPool.totalSwapFee);
            const swapVolume24h = parseFloat(pool.totalSwapVolume) - parseFloat(previousPool.totalSwapVolume);

            if (
                Math.abs(swapFees24h) > 500_000_000 ||
                swapVolume24h > Math.abs(500_000_000) ||
                swapFees24h < 0 ||
                swapVolume24h < 0
            ) {
                continue;
            }

            snapshots.push({
                id: `${poolId}-${block.timestamp}`,
                poolId,
                timestamp: parseInt(block.timestamp),
                totalShares: pool.totalShares,
                totalSwapFee: pool.totalSwapFee,
                totalSwapVolume: pool.totalSwapVolume,
                totalLiquidity: pool.totalLiquidity,
                swapFees24h: `${parseFloat(pool.totalSwapFee) - parseFloat(previousPool.totalSwapFee)}`,
                swapVolume24h: `${parseFloat(pool.totalSwapVolume) - parseFloat(previousPool.totalSwapVolume)}`,
                liquidityChange24h: `${parseFloat(pool.totalLiquidity) - parseFloat(previousPool.totalLiquidity)}`,
                tokens: (pool.tokens || []).map((token) => ({
                    ...token,
                    __typename: 'GqlBalancerPoolToken',
                })),
            });
        }

        const orderedSnapshots = _.orderBy(snapshots, 'timestamp', 'asc');

        await cache.putObjectValue(
            `${POOL_SNAPSHOTS_CACHE_KEY_PREFIX}:${poolId}:${blocks[0].number}`,
            orderedSnapshots,
            oneDayInMinutes,
        );

        return orderedSnapshots;
    }

    private async getBlacklistedPools() {
        const response = await sanityClient.fetch<string[] | null>(
            `*[_type == "config" && chainId == 250][0].blacklistedPools`,
        );

        return response || [];
    }
}

export const balancerService = new BalancerService();
