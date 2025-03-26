import { Chain, PrismaPoolType } from '@prisma/client';
import { PrismaPoolAndHookWithDynamic, HookData } from '../../../prisma/prisma-types';
import { prisma } from '../../../prisma/prisma-client';
import { Cache } from 'memory-cache';
import config from '../../../config';
import { poolsToIgnore } from './constants';

const cache = new Cache<
    string,
    { pools: PrismaPoolAndHookWithDynamic[]; underlyingTokens: { address: string; decimals: number }[] }
>();
const SOR_POOLS_CACHE_KEY = `sor:pools`;

export async function getBasePoolsFromDb(
    chain: Chain,
    protocolVersion: number,
    considerPoolsWithHooks: boolean,
    poolIds?: string[],
): Promise<{ pools: PrismaPoolAndHookWithDynamic[]; underlyingTokens: { address: string; decimals: number }[] }> {
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
        ] as PrismaPoolType[],
    };

    if (poolIds?.length) {
        return getPoolsByIds(chain, protocolVersion, type, poolIds);
    }

    const cacheKey = `${SOR_POOLS_CACHE_KEY}:${chain}:${protocolVersion}:${considerPoolsWithHooks}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const result = await getFilteredPools(chain, protocolVersion, considerPoolsWithHooks, type);

    // cache for 10s
    cache.put(cacheKey, result, 10 * 1000);
    return result;
}

async function getPoolsByIds(chain: Chain, protocolVersion: number, type: { in: PrismaPoolType[] }, poolIds: string[]) {
    const pools = await prisma.prismaPool.findMany({
        where: { id: { in: poolIds }, chain, protocolVersion, type },
        include: {
            dynamicData: true,
            tokens: { include: { token: true } },
        },
    });
    const underlyingTokens = await getUnderlyingTokensFromDBPools(pools, chain);
    return { pools, underlyingTokens };
}

async function getFilteredPools(
    chain: Chain,
    protocolVersion: number,
    considerPoolsWithHooks: boolean,
    type: { in: PrismaPoolType[] },
) {
    const poolIdsToExclude = config[chain].sor?.poolIdsToExclude ?? [];

    const [pools, lbps] = await Promise.all([
        getPrimaryPools(chain, protocolVersion, type, poolIdsToExclude),
        getLiquidityBootstrappingPools(chain, protocolVersion, poolIdsToExclude),
    ]);

    const filteredPools = [...filterPoolsByHooks(pools, considerPoolsWithHooks), ...lbps];

    const underlyingTokens = await getUnderlyingTokensFromDBPools(filteredPools, chain);
    return { pools: filteredPools, underlyingTokens };
}

function filterPoolsByHooks(pools: PrismaPoolAndHookWithDynamic[], considerPoolsWithHooks: boolean) {
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
) {
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

async function getLiquidityBootstrappingPools(chain: Chain, protocolVersion: number, poolIdsToExclude: string[]) {
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
): Promise<{ address: string; decimals: number }[]> {
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

function logMissingTokens(underlyingTokens: any[], underlyingTokenAddresses: string[]) {
    if (underlyingTokens.length !== underlyingTokenAddresses.length) {
        underlyingTokenAddresses.forEach((address) => {
            if (!underlyingTokens.find((token) => token.address === address)) {
                console.warn('Underlying token not found for pool', address);
            }
        });
    }
}
