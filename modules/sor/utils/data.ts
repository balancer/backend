import { Chain, PrismaPoolType, PrismaToken } from '@prisma/client';
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
            'LIQUIDITY_BOOTSTRAPPING',
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
        const pools = await getPoolsByIds(chain, protocolVersion, type, poolIds);
        const underlyingTokens = await getUnderlyingTokensFromDBPools(pools, chain);
        return { pools, underlyingTokens };
    }

    const cacheKey = `${SOR_POOLS_CACHE_KEY}:${chain}:${protocolVersion}:${considerPoolsWithHooks}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const pools = await getFilteredPools(chain, protocolVersion, considerPoolsWithHooks, type);
    const underlyingTokens = await getUnderlyingTokensFromDBPools(pools, chain);

    // cache for 10s
    cache.put(cacheKey, { pools, underlyingTokens }, 10 * 1000);
    return { pools, underlyingTokens };
}

async function getPoolsByIds(
    chain: Chain,
    protocolVersion: number,
    type: { in: PrismaPoolType[] },
    poolIds: string[],
): Promise<PrismaPoolAndHookWithDynamic[]> {
    const pools = await prisma.prismaPool.findMany({
        where: { id: { in: poolIds }, chain, protocolVersion, type: { in: [...type.in, 'LIQUIDITY_BOOTSTRAPPING'] } },
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

function logMissingTokens(underlyingTokens: PrismaToken[], underlyingTokenAddresses: string[]) {
    if (underlyingTokens.length !== underlyingTokenAddresses.length) {
        underlyingTokenAddresses.forEach((address) => {
            if (!underlyingTokens.find((token) => token.address === address)) {
                console.error(`Underlying prisma token not found for ${address}`);
            }
        });
    }
}
