import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { isComposableStablePool } from '../pool-utils';

export class PhantomStableAprService implements PoolAprService {
    constructor(private readonly yieldProtocolFeePercentage: number) {}

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const phantomStablePools = pools.filter((pool) => pool.type === 'PHANTOM_STABLE');

        for (const pool of phantomStablePools) {
            const collectsYieldFee = isComposableStablePool(pool);
            const linearPoolTokens = pool.tokens.filter((token) => token.nestedPool?.type === 'LINEAR');
            const linearPoolIds = linearPoolTokens.map((token) => token.nestedPool?.id || '');
            const aprItems = await prisma.prismaPoolAprItem.findMany({
                where: { poolId: { in: linearPoolIds }, type: 'LINEAR_BOOSTED' },
            });

            for (const token of linearPoolTokens) {
                const aprItem = aprItems.find((item) => item.poolId === token.nestedPoolId);

                if (aprItem && token.dynamicData && token.nestedPool && token.nestedPool.dynamicData) {
                    const itemId = `${pool.id}-${token.token.address}-${token.index}`;
                    const { totalShares } = token.nestedPool.dynamicData;
                    const tokenBalance = parseFloat(token.dynamicData.balance);
                    const apr = aprItem.apr * (tokenBalance / parseFloat(totalShares));
                    const userApr = collectsYieldFee ? apr * (1 - this.yieldProtocolFeePercentage) : apr;

                    await prisma.prismaPoolAprItem.upsert({
                        where: { id: itemId },
                        create: {
                            id: itemId,
                            poolId: pool.id,
                            apr: userApr,
                            title: aprItem.title,
                            group: aprItem.group,
                            type: 'PHANTOM_STABLE_BOOSTED',
                        },
                        update: { apr: userApr, type: 'PHANTOM_STABLE_BOOSTED' },
                    });
                }
            }
        }
    }
}
