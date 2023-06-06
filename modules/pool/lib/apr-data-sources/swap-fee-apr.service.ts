import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { networkContext } from '../../../network/network-context.service';

const MAX_DB_INT = 9223372036854775807;
export class SwapFeeAprService implements PoolAprService {
    constructor(private readonly swapProtocolFeePercentage: number) {}

    public getAprServiceName(): string {
        return 'SwapFeeAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const operations: any[] = [];

        for (const pool of pools) {
            if (pool.dynamicData) {
                const apr =
                    pool.dynamicData.totalLiquidity > 0
                        ? (pool.dynamicData.fees24h * 365) / pool.dynamicData.totalLiquidity
                        : 0;

                let userApr = apr * (1 - this.swapProtocolFeePercentage);

                if (pool.dynamicData.isInRecoveryMode || pool.type === 'LIQUIDITY_BOOTSTRAPPING') {
                    // pool does not collect any protocol fees
                    userApr = apr;
                }

                // TODO: clean this up
                if (userApr > MAX_DB_INT) {
                    userApr = 0;
                }

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: `${pool.id}-swap-apr`, chain: networkContext.chain } },
                        create: {
                            id: `${pool.id}-swap-apr`,
                            chain: networkContext.chain,
                            poolId: pool.id,
                            title: 'Swap fees APR',
                            apr: userApr,
                            type: 'SWAP_FEE',
                        },
                        update: { apr: userApr },
                    }),
                );
            }
        }

        await prismaBulkExecuteOperations(operations);
    }
}
