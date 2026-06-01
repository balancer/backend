import { Cache } from 'memory-cache';
import { Address, parseEther, parseUnits } from 'viem';
import { Chain, PrismaPoolType, PrismaToken } from '@prisma/client';

import { prisma } from '../../../prisma/prisma-client';
import { PrismaPoolAndHookWithDynamic, HookData } from '../../../prisma/prisma-types';
import { chainToChainId } from '../../network/chain-id-to-chain';
import { poolsToIgnore } from './constants';
import _ from 'lodash';
import { tokenService } from '../../token/token.service';
import { env } from '../../../apps/env';
import { ZERO_ADDRESS } from '@balancer/sdk';

export type BufferPoolData = {
    poolId: string;
    address: Address;
    chainId: number;
    mainToken: { address: Address; decimals: number; balance: bigint };
    underlyingToken: { address: Address; decimals: number; balance: bigint };
    poolType: string;
    unwrapRate: bigint;
    maxDeposit: bigint;
    maxWithdraw: bigint;
};

export type SORDbPool = PrismaPoolAndHookWithDynamic;

const cache = new Cache<string, { pools: SORDbPool[]; bufferPools: BufferPoolData[] }>();
const SOR_POOLS_CACHE_KEY = `sor:pools`;

export async function getBasePoolsFromDb(
    chain: Chain,
    protocolVersion: number,
    considerPoolsWithHooks: boolean,
    poolIds?: string[],
): Promise<{ pools: SORDbPool[]; bufferPools: BufferPoolData[] }> {
    const cacheKey = `${SOR_POOLS_CACHE_KEY}:${chain}:${poolIds}`;

    let cached = cache.get(cacheKey);

    if (!cached) {
        // get pools
        console.time('SOR:getpools');
        const pools = await getPools(chain, poolIds);
        console.timeEnd('SOR:getpools');
        const bufferPools = await getBufferPoolsFromDBPools(pools, chain);
        cached = cache.put(cacheKey, { pools, bufferPools }, parseInt(env.SOR_POOLS_CACHE_TTL_SECONDS) * 1000);
    }

    // Filter by protocol version and hook preferences
    const pools = cached.pools
        .filter((pool) => pool.protocolVersion === protocolVersion)
        .filter((pool) => {
            if (considerPoolsWithHooks) return true;
            // When not considering hooks, only keep pools without hooks or with always-allowed hook types
            if (!pool.hook || Object.keys(pool.hook).length === 0) return true;
            const hook = pool.hook as HookData;
            return hook.type === 'MEV_TAX' || hook.type === 'RECLAMM' || hook.type === 'LBP';
        });

    const requestedPoolIds = pools.map((pool) => pool.id);

    const bufferPools = cached.bufferPools.filter((bufferPool) => requestedPoolIds.includes(bufferPool.poolId));

    return { pools, bufferPools };
}

async function getPools(chain: Chain, poolIds?: string[]): Promise<SORDbPool[]> {
    const type = {
        in: [
            'WEIGHTED',
            'META_STABLE',
            'PHANTOM_STABLE',
            'COMPOSABLE_STABLE',
            'STABLE',
            'FX',
            'GYRO',
            'GYRO3',
            'GYROE',
            'QUANT_AMM_WEIGHTED',
            'RECLAMM',
            'LIQUIDITY_BOOTSTRAPPING',
            'FIXED_LBP',
        ] as PrismaPoolType[],
    };

    let pools = [] as SORDbPool[];

    if (poolIds && poolIds.length > 0) {
        pools = await prisma.prismaPool.findMany({
            where: {
                id: { in: poolIds },
                chain,
                type,
                dynamicData: {
                    totalSharesNum: { gt: 0.000000000001 },
                    swapEnabled: true,
                    isPaused: false,
                },
            },
            include: {
                tokens: {
                    orderBy: [{ index: 'asc' }],
                    include: {
                        token: true,
                    },
                },
                dynamicData: true,
            },
        });
    } else {
        pools = await prisma.prismaPool.findMany({
            where: {
                id: { notIn: [...poolsToIgnore] },
                chain,
                type,
                dynamicData: {
                    OR: [
                        {
                            totalLiquidity: { gte: 100 },
                        },
                        {
                            chain: 'SEPOLIA',
                        },
                        {
                            pool: {
                                type: 'LIQUIDITY_BOOTSTRAPPING',
                            },
                        },
                    ],
                    totalSharesNum: { gt: 0.000000000001 },
                    swapEnabled: true,
                    isPaused: false,
                },
            },
            include: {
                tokens: {
                    orderBy: [{ index: 'asc' }],
                    include: {
                        token: true,
                    },
                },
                dynamicData: true,
            },
        });
    }

    // Remove pools with unsupported hooks (invariant regardless of caller preferences)
    pools = pools.filter((pool) => {
        if (!pool.hook || Object.keys(pool.hook).length === 0) return true;
        const hook = pool.hook as HookData;
        if (hook.type === 'MEV_TAX' || hook.type === 'RECLAMM' || hook.type === 'LBP') return true;
        // non-STABLE pools with STABLE_SURGE hooks are never supported
        if (pool.type !== 'STABLE' && hook.type === 'STABLE_SURGE') return false;
        const isSupportedHookType = hook.type !== undefined && hook.type !== 'UNKNOWN';
        if (!isSupportedHookType) {
            console.log('Pool has unsupported hook type', pool.id, hook.type);
        }
        return isSupportedHookType;
    });

    // Only allow pools where every token with a rate provider has been explicitly reviewed
    const reviewedProviders = await prisma.prismaPriceRateProviderData.findMany({
        where: { chain, reviewed: true },
        select: { rateProviderAddress: true },
    });
    const reviewedAddresses = new Set(reviewedProviders.map((p) => p.rateProviderAddress.toLowerCase()));

    return pools.filter((pool) =>
        pool.tokens.every(
            (t) =>
                !t.priceRateProvider ||
                t.priceRateProvider === ZERO_ADDRESS ||
                reviewedAddresses.has(t.priceRateProvider.toLowerCase()),
        ),
    );

    // This is alternative in case the DB gets too high CPU usage
    // const [pools, dynamicData, poolTokens, tokens] = await Promise.all([
    //     prisma.prismaPool
    //         .findMany({
    //             where: { chain, type, id: { notIn: [...poolsToIgnore] } },
    //         })
    //         .then((records) => Object.fromEntries(records.map((record) => [record.id, record]))),
    //     prisma.prismaPoolDynamicData
    //         .findMany({
    //             // TODO: Narrow down the select, but need to change the return type to SOR internal one first
    //             // select: { id: true, isPaused: true, swapEnabled: true },
    //             where: {
    //                 chain,
    //                 totalSharesNum: { gt: 0.000000000001 },
    //                 swapEnabled: true,
    //                 isPaused: false,
    //                 id: { notIn: [...poolsToIgnore] },
    //                 OR: [
    //                     {
    //                         totalLiquidity: { gte: 100 },
    //                     },
    //                     {
    //                         chain: 'SEPOLIA',
    //                     },
    //                     {
    //                         pool: {
    //                             type: 'LIQUIDITY_BOOTSTRAPPING',
    //                         },
    //                     },
    //                 ],
    //             },
    //         })
    //         .then((records) => Object.fromEntries(records.map((record) => [record.id, record]))),
    //     prisma.prismaPoolToken
    //         .findMany({
    //             where: {
    //                 pool: {
    //                     chain,
    //                     type,
    //                     id: { notIn: [...poolsToIgnore] },
    //                 },
    //             },
    //         })
    //         .then((records) => _.groupBy(records, 'poolId') as Record<string, typeof records>),
    //     tokenService
    //         .getTokens(chain)
    //         .then((tokens) => Object.fromEntries(tokens.map((token) => [token.address, token]))),
    // ]);

    // const setWithDynamicDataIds = new Set(Object.keys(dynamicData));
    // const intersection = [...new Set(Object.keys(pools))].filter((id) => setWithDynamicDataIds.has(id));

    // return intersection.map((id) => ({
    //     ...pools[id],
    //     dynamicData: dynamicData[id],
    //     tokens: poolTokens[id].map((pt) => ({
    //         ...pt,
    //         token: tokens[pt.address],
    //     })),
    // }));
}

export async function getBufferPoolsFromDBPools(pools: SORDbPool[], chain: Chain): Promise<BufferPoolData[]> {
    const v3Pools = pools.filter((pool) => pool.protocolVersion === 3);

    const tokensWithUnderlying = v3Pools.flatMap((pool) =>
        pool.tokens.filter((token) => token.token.underlyingTokenAddress !== null).map((token) => token.address),
    );

    const erc4626Reviews = await tokenService.getErc4626Data();

    const erc4626ThatCanBeUsedForSwaps = Object.values(erc4626Reviews)
        .filter(
            (review): review is NonNullable<typeof review> =>
                review?.chain === chain &&
                review?.canUseBufferForSwaps === true &&
                tokensWithUnderlying.includes(review?.erc4626Address),
        )
        .map((review) => review);

    const wrappedTokenAddresses = erc4626ThatCanBeUsedForSwaps.map((data) => data.erc4626Address);
    const underlyingTokenAddresses = erc4626ThatCanBeUsedForSwaps.map((data) => data.assetAddress);

    const tokens = await tokenService.getTokens(chain);
    const tokensMap = Object.fromEntries(tokens.map((token) => [token.address.toLowerCase(), token]));

    logMissingTokens(tokens, underlyingTokenAddresses);

    // instead of an actual buffer pool, I'd like to return an object that can be used to build a buffer pool
    const bufferPools: BufferPoolData[] = [];
    for (const pool of v3Pools) {
        for (const poolToken of pool.tokens) {
            // check if token can be used for swaps through buffer pools
            if (poolToken.token.underlyingTokenAddress && wrappedTokenAddresses.includes(poolToken.address)) {
                // check if underlying token exists in the database
                const underlyingToken = tokensMap[poolToken.token.underlyingTokenAddress];
                if (underlyingToken) {
                    bufferPools.push({
                        poolId: pool.id,
                        address: poolToken.address.toLowerCase() as Address,
                        chainId: Number(chainToChainId[chain]),
                        mainToken: {
                            address: poolToken.address.toLowerCase() as Address,
                            decimals: poolToken.token.decimals,
                            balance: parseUnits(poolToken.token.bufferBalanceWrapped, poolToken.token.decimals),
                        },
                        underlyingToken: {
                            address: underlyingToken.address.toLowerCase() as Address,
                            decimals: underlyingToken.decimals,
                            balance: parseUnits(poolToken.token.bufferBalanceUnderlying, underlyingToken.decimals),
                        },
                        poolType: 'Buffer',
                        unwrapRate: parseEther(poolToken.token.unwrapRate), // the way we store rates already takes into account main/underlying decimals differences
                        maxWithdraw: parseUnits(poolToken.token.maxWithdraw, poolToken.token.decimals),
                        maxDeposit: parseUnits(poolToken.token.maxDeposit, poolToken.token.decimals),
                    });
                }
            }
        }
    }
    return bufferPools;
}

function logMissingTokens(underlyingTokens: PrismaToken[], underlyingTokenAddresses: string[]) {
    if (underlyingTokens.length !== underlyingTokenAddresses.length) {
        underlyingTokenAddresses.forEach((address) => {
            if (!underlyingTokens.find((token) => token.address === address)) {
                console.error(`Underlying prisma token not found for ${address}`);
            }
        });
    }
}

/**
 * Fetches current token prices for a chain and returns a lowercase-address -> price map.
 * Uses the shared tokenService cache to avoid redundant DB hits.
 */
export async function getTokenPricesMap(chain: Chain): Promise<Map<string, number>> {
    const prices = await tokenService.getTokenPrices(chain);
    const map = new Map<string, number>();
    for (const p of prices) {
        map.set(p.tokenAddress.toLowerCase(), p.price);
    }
    return map;
}
