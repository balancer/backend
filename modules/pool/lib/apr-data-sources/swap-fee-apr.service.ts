import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';

export class SwapFeeAprService implements PoolAprService {
    constructor(private readonly swapProtocolFeePercentage: number) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const operations: any[] = [];

        for (const pool of pools) {
            if (pool.dynamicData) {
                const apr =
                    pool.dynamicData.totalLiquidity > 0
                        ? (pool.dynamicData.fees24h * 365) / pool.dynamicData.totalLiquidity
                        : 0;

                const grossApr = apr * (1 - this.swapProtocolFeePercentage);

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id: `${pool.id}-swap-apr` },
                        create: {
                            id: `${pool.id}-swap-apr`,
                            poolId: pool.id,
                            title: 'Swap fees APR',
                            apr: grossApr,
                            type: 'SWAP_FEE',
                        },
                        update: { apr: grossApr },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations);
    }
}
