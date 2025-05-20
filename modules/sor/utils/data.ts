import { Cache } from 'memory-cache';
import { Address, parseUnits } from 'viem';
import { isSameAddress } from '@balancer/sdk';
import { Chain, PrismaPoolType, PrismaToken } from '@prisma/client';

import config from '../../../config';
import { prisma } from '../../../prisma/prisma-client';
import { PrismaPoolAndHookWithDynamic, HookData } from '../../../prisma/prisma-types';
import { chainToChainId } from '../../network/chain-id-to-chain';
import { poolsToIgnore } from './constants';

export type BufferPoolData = {
    address: Address;
    chainId: number;
    mainToken: { address: Address; decimals: number };
    underlyingToken: { address: Address; decimals: number };
    poolType: string;
    unwrapRate: bigint;
};

const cache = new Cache<string, { pools: PrismaPoolAndHookWithDynamic[]; bufferPools: BufferPoolData[] }>();
const SOR_POOLS_CACHE_KEY = `sor:pools`;

export async function getBasePoolsFromDb(
    chain: Chain,
    protocolVersion: number,
    considerPoolsWithHooks: boolean,
    poolIds?: string[],
): Promise<{ pools: PrismaPoolAndHookWithDynamic[]; bufferPools: BufferPoolData[] }> {
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
        ] as PrismaPoolType[],
    };

    if (poolIds?.length) {
        const typeWithLBP = { in: [...type.in, 'LIQUIDITY_BOOTSTRAPPING'] as PrismaPoolType[] };
        const pools = await getPoolsByIds(chain, protocolVersion, typeWithLBP, poolIds);
        const underlyingTokens = await getUnderlyingTokensFromDBPools(pools, chain);
        const bufferPools = getBufferPoolsFromDBPools(pools, underlyingTokens, chain);
        return { pools, bufferPools };
    }

    const cacheKey = `${SOR_POOLS_CACHE_KEY}:${chain}:${protocolVersion}:${considerPoolsWithHooks}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const pools = await getFilteredPools(chain, protocolVersion, considerPoolsWithHooks, type);
    const underlyingTokens = await getUnderlyingTokensFromDBPools(pools, chain);
    const bufferPools = getBufferPoolsFromDBPools(pools, underlyingTokens, chain);

    // cache for 10s
    cache.put(cacheKey, { pools, bufferPools }, 10 * 1000);
    return { pools, bufferPools };
}

async function getPoolsByIds(
    chain: Chain,
    protocolVersion: number,
    type: { in: PrismaPoolType[] },
    poolIds: string[],
): Promise<PrismaPoolAndHookWithDynamic[]> {
    const pools = await prisma.prismaPool.findMany({
        where: { id: { in: poolIds }, chain, protocolVersion, type },
        include: {
            dynamicData: true,
            tokens: { include: { token: true } },
        },
    });

    return pools;
}

async function getFilteredPools(
    chain: Chain,
    protocolVersion: number,
    considerPoolsWithHooks: boolean,
    type: { in: PrismaPoolType[] },
): Promise<PrismaPoolAndHookWithDynamic[]> {
    const poolIdsToExclude = config[chain].sor?.poolIdsToExclude ?? [];

    const [pools, lbps] = await Promise.all([
        getPrimaryPools(chain, protocolVersion, type, poolIdsToExclude),
        getLiquidityBootstrappingPools(chain, protocolVersion, poolIdsToExclude),
    ]);

    const filteredPools = [...filterPoolsByHooks(pools, considerPoolsWithHooks), ...lbps];

    return filteredPools;
}

function filterPoolsByHooks(
    pools: PrismaPoolAndHookWithDynamic[],
    considerPoolsWithHooks: boolean,
): PrismaPoolAndHookWithDynamic[] {
    return pools.filter((pool) => {
        if (!pool.hook || Object.keys(pool.hook).length === 0) return true;

        const hook = pool.hook as HookData;
        if (hook.type === 'MEV_TAX') return true;
        if (!considerPoolsWithHooks) return false;

        const isSupportedHookType = hook.type !== undefined && hook.type !== 'UNKNOWN';
        if (!isSupportedHookType) {
            console.log('Pool has unsupported hook type', pool.id, hook.type);
        }
        return isSupportedHookType;
    });
}

async function getPrimaryPools(
    chain: Chain,
    protocolVersion: number,
    type: { in: PrismaPoolType[] },
    poolIdsToExclude: string[],
): Promise<PrismaPoolAndHookWithDynamic[]> {
    return prisma.prismaPool.findMany({
        where: {
            chain,
            protocolVersion,
            dynamicData: {
                totalSharesNum: { gt: 0.000000000001 },
                swapEnabled: true,
                totalLiquidity: { gte: chain === 'SEPOLIA' ? 0 : 100 },
            },
            id: { notIn: [...poolIdsToExclude, ...poolsToIgnore] },
            type,
        },
        include: {
            dynamicData: true,
            tokens: { include: { token: true } },
        },
    });
}

async function getLiquidityBootstrappingPools(
    chain: Chain,
    protocolVersion: number,
    poolIdsToExclude: string[],
): Promise<PrismaPoolAndHookWithDynamic[]> {
    return prisma.prismaPool.findMany({
        where: {
            chain,
            protocolVersion,
            dynamicData: {
                totalSharesNum: { gt: 0.000000000001 },
                swapEnabled: true,
            },
            id: { notIn: [...poolIdsToExclude, ...poolsToIgnore] },
            type: { in: ['LIQUIDITY_BOOTSTRAPPING'] },
        },
        include: { dynamicData: true, tokens: { include: { token: true } } },
    });
}

export async function getUnderlyingTokensFromDBPools(
    pools: PrismaPoolAndHookWithDynamic[],
    chain: Chain,
): Promise<{ address: string; decimals: number; unwrapRate: string }[]> {
    const tokensWithUnderlying = pools.flatMap((pool) =>
        pool.tokens.filter((token) => token.token.underlyingTokenAddress !== null),
    );

    const erc4626ThatCanBeUsedForSwaps = await prisma.prismaErc4626ReviewData.findMany({
        where: {
            chain,
            erc4626Address: { in: tokensWithUnderlying.map((token) => token.address) },
            canUseBufferForSwaps: true,
        },
    });

    const underlyingTokenAddresses = erc4626ThatCanBeUsedForSwaps.map((data) => data.assetAddress);

    const underlyingTokens = await prisma.prismaToken.findMany({
        where: { chain, address: { in: underlyingTokenAddresses } },
    });

    logMissingTokens(underlyingTokens, underlyingTokenAddresses);
    return underlyingTokens;
}

export function getBufferPoolsFromDBPools(
    pools: PrismaPoolAndHookWithDynamic[],
    underlyingTokens: { address: string; decimals: number }[],
    chain: Chain,
): BufferPoolData[] {
    // instead of an actual buffer pool, I'd like to return an object that can be used to build a buffer pool
    const bufferPools: BufferPoolData[] = [];
    for (const pool of pools) {
        for (const poolToken of pool.tokens) {
            if (poolToken.token.underlyingTokenAddress) {
                const underlyingToken = underlyingTokens.find((t) =>
                    isSameAddress(t.address as Address, poolToken.token.underlyingTokenAddress as Address),
                );
                if (underlyingToken) {
                    const unwrapRateDecimals = 18 - poolToken.token.decimals + underlyingToken.decimals;
                    bufferPools.push({
                        address: poolToken.address.toLowerCase() as Address,
                        chainId: Number(chainToChainId[chain]),
                        mainToken: {
                            address: poolToken.address.toLowerCase() as Address,
                            decimals: poolToken.token.decimals,
                        },
                        underlyingToken: {
                            address: underlyingToken.address.toLowerCase() as Address,
                            decimals: underlyingToken.decimals,
                        },
                        poolType: 'Buffer',
                        unwrapRate: parseUnits(poolToken.token.unwrapRate, unwrapRateDecimals),
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
