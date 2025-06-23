import { AprHandler, PoolAPRData } from '../../types';
import { PrismaPoolAprItem } from '@prisma/client';

const MAX_DB_INT = 9223372036854775807;

export class SwapFeeAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'SwapFeeAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        for (const pool of pools) {
            if (pool.dynamicData) {
                const apr =
                    pool.dynamicData.totalLiquidity > 0
                        ? (pool.dynamicData.fees24h * 365) / pool.dynamicData.totalLiquidity
                        : 0;

                let protocolFee = parseFloat(pool.dynamicData.protocolSwapFee);
                if (pool.type === 'GYROE') {
                    protocolFee = parseFloat(pool.dynamicData.protocolYieldFee || '0');
                }

                if (pool.protocolVersion === 3) {
                    protocolFee = parseFloat(pool.dynamicData.aggregateSwapFee);
                }

                if (pool.dynamicData.isInRecoveryMode || pool.type === 'LIQUIDITY_BOOTSTRAPPING') {
                    protocolFee = 0;
                }

                let userApr = apr * (1 - protocolFee);

                if (userApr > MAX_DB_INT) {
                    userApr = 0;
                }

                aprItems.push({
                    id: `${pool.id}-swap-apr-24h`,
                    chain: pool.chain,
                    poolId: pool.id,
                    title: 'Swap fees APR (24h)',
                    apr: userApr,
                    type: 'SWAP_FEE_24H',
                    rewardTokenAddress: null,
                    rewardTokenSymbol: null,
                });
            }
        }

        return aprItems;
    }
}
