import { prisma } from '../../../../prisma/prisma-client';
import { Chain, PrismaPoolAprItem, PrismaPoolAprType, PrismaPoolType } from '@prisma/client';
import { daysAgo } from '../../../common/time';
import { AprHandler, PoolAPRData } from '../../types';

type PoolSwapFeeData = {
    poolId: string;
    chain: Chain;
    dynamic_fees_24h: number;
    fees_24h: number;
    surplus_24h: number;
};

const query = (chain: Chain, timestamp: number) => `
    SELECT
        "poolId",
        chain,
        SUM((payload->'dynamicFee'->>'valueUSD')::numeric) AS dynamic_fees_24h,
        SUM((payload->'fee'->>'valueUSD')::numeric) AS fees_24h,
        SUM((payload->'surplus'->>'valueUSD')::numeric) AS surplus_24h
    FROM
        "PartitionedPoolEvent"
    WHERE
        "blockTimestamp" >= ${timestamp}
    AND chain = '${chain}'
    AND type = 'SWAP'
    GROUP BY
        1, 2
`;

const MAX_DB_INT = 0x1fff_ffff_fff_fff;

export class SwapFeeAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'SwapFeeAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const chain = pools[0].chain;
        const yesterday = daysAgo(1);

        // Fetch the swap fees for the last 30 days
        const swapFeeData = await prisma.$queryRawUnsafe<PoolSwapFeeData[]>(query(chain, yesterday));

        // Map the swap fee data to the pool id
        const swapFeeDataMap = swapFeeData.reduce(
            (acc, data) => {
                acc[data.poolId] = data;
                return acc;
            },
            {} as Record<string, PoolSwapFeeData>,
        );

        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = ([] = pools
            .flatMap((pool) => {
                if (!pool.dynamicData) return null;

                const dynamicApr = dynamicSwapFeeAprCalculation(
                    pool.dynamicData.totalLiquidity,
                    swapFeeDataMap[pool.id].dynamic_fees_24h,
                    parseFloat(pool.dynamicData.aggregateSwapFee),
                    pool.dynamicData.isInRecoveryMode,
                );

                const swapApr = swapFeeAprCalculation(
                    pool.dynamicData.totalLiquidity,
                    swapFeeDataMap[pool.id].fees_24h,
                    parseFloat(pool.dynamicData.protocolSwapFee),
                    parseFloat(pool.dynamicData.aggregateSwapFee),
                    parseFloat(pool.dynamicData.protocolYieldFee || '0'),
                    pool.dynamicData.isInRecoveryMode,
                    pool.type,
                    pool.protocolVersion as 1 | 2 | 3,
                );

                const surplusApr = surplusAprCalculation(
                    pool.dynamicData.totalLiquidity,
                    swapFeeDataMap[pool.id].surplus_24h,
                );

                return [
                    {
                        id: `${pool.id}-dynamic-swap-apr-24h`,
                        chain,
                        poolId: pool.id,
                        title: 'Dynamic swap fees APR',
                        apr: dynamicApr,
                        type: PrismaPoolAprType.DYNAMIC_SWAP_FEE_24H,
                        rewardTokenAddress: null,
                        rewardTokenSymbol: null,
                    },
                    {
                        id: `${pool.id}-swap-apr-24h`,
                        chain: chain,
                        poolId: pool.id,
                        title: 'Swap fees APR (24h)',
                        apr: swapApr,
                        type: PrismaPoolAprType.SWAP_FEE_24H,
                        rewardTokenAddress: null,
                        rewardTokenSymbol: null,
                    },
                    pool.type === 'COW_AMM'
                        ? {
                              id: `${pool.id}-surplus-24h`,
                              chain,
                              poolId: pool.id,
                              title: `Surplus APR`,
                              apr: surplusApr,
                              type: PrismaPoolAprType.SURPLUS_24H,
                              rewardTokenAddress: null,
                              rewardTokenSymbol: null,
                          }
                        : null,
                ];
            })
            .filter((entry): entry is NonNullable<typeof entry> => !!entry));

        return aprItems;
    }
}

const dynamicSwapFeeAprCalculation = (
    totalLiquidity: number,
    swapFees: number,
    protocolFee: number,
    isInRecoveryMode: boolean,
) => {
    let apr_24h = 0;

    if (isInRecoveryMode) {
        protocolFee = 0;
    }

    if (totalLiquidity > 0 && swapFees) {
        apr_24h = ((swapFees * 365) / totalLiquidity) * (1 - protocolFee);
    }

    if (apr_24h > MAX_DB_INT) {
        apr_24h = 0;
    }

    return apr_24h;
};

const swapFeeAprCalculation = (
    totalLiquidity: number,
    swapFees: number,
    protocolSwapFee: number,
    aggregateSwapFee: number,
    protocolYieldFee: number,
    isInRecoveryMode: boolean,
    poolType: PrismaPoolType,
    protocolVersion: 1 | 2 | 3,
) => {
    const apr = totalLiquidity > 0 ? (swapFees * 365) / totalLiquidity : 0;

    let protocolFee = protocolSwapFee;

    if (poolType === 'GYROE') {
        protocolFee = protocolYieldFee;
    }

    if (protocolVersion === 3) {
        protocolFee = aggregateSwapFee;
    }

    if (isInRecoveryMode || poolType === 'LIQUIDITY_BOOTSTRAPPING') {
        protocolFee = 0;
    }

    let userApr = apr * (1 - protocolFee);

    if (userApr > MAX_DB_INT) {
        userApr = 0;
    }

    return userApr;
};

const surplusAprCalculation = (totalLiquidity: number, surplus24h: number) => {
    return surplus24h <= 0 || totalLiquidity === 0 ? 0 : (surplus24h * 365) / totalLiquidity;
};
