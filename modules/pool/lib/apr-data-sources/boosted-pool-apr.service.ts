import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { collectsYieldFee } from '../pool-utils';
import { networkContext } from '../../../network/network-context.service';

export class BoostedPoolAprService implements PoolAprService {
    public getAprServiceName(): string {
        return 'BoostedPoolAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithExpandedNesting[]): Promise<void> {
        const boostedPools = pools.filter(
            (pool) =>
                (pool.type === 'PHANTOM_STABLE' || pool.type === 'WEIGHTED') &&
                pool.tokens.find((token) => token.nestedPool),
        );

        for (const pool of boostedPools) {
            const protocolYieldFeePercentage = pool.dynamicData?.protocolYieldFee
                ? parseFloat(pool.dynamicData.protocolYieldFee)
                : networkContext.data.balancer.yieldProtocolFeePercentage;
            const tokens = pool.tokens.filter((token) => {
                if (token.address === pool.address) {
                    return false;
                }

                //for phantom stable pools, the linear apr items have already been set in PhantomStableAprService,
                //so we're only concerned with finding the apr for phantom stable BPTs nested inside of
                //this phantom stable
                if (pool.type === 'PHANTOM_STABLE') {
                    return token.nestedPool?.type === 'PHANTOM_STABLE';
                }

                return token.nestedPool?.type === 'LINEAR' || token.nestedPool?.type === 'PHANTOM_STABLE';
            });

            const poolIds = tokens.map((token) => token.nestedPool?.id || '');
            const aprItems = await prisma.prismaPoolAprItem.findMany({
                where: {
                    poolId: { in: poolIds },
                    type: { in: ['LINEAR_BOOSTED', 'PHANTOM_STABLE_BOOSTED', 'IB_YIELD'] },
                    chain: networkContext.chain,
                },
            });

            for (const token of tokens) {
                const tokenAprItems = aprItems.filter((item) => item.poolId === token.nestedPoolId);

                if (
                    !pool.dynamicData ||
                    !token.dynamicData ||
                    !token.nestedPool ||
                    !token.nestedPool.dynamicData ||
                    token.dynamicData.balanceUSD === 0
                ) {
                    continue;
                }

                for (const aprItem of tokenAprItems) {
                    const itemId = `${pool.id}-${aprItem.id}`;
                    //scale the apr as a % of total liquidity

                    const apr = aprItem.apr * (token.dynamicData.balanceUSD / pool.dynamicData.totalLiquidity);
                    let userApr = apr;

                    if (
                        collectsYieldFee(pool) &&
                        //nested phantom stables already have the yield fee removed
                        token.nestedPool.type !== 'PHANTOM_STABLE'
                    ) {
                        userApr = apr * (1 - protocolYieldFeePercentage);
                    }

                    await prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: itemId, chain: networkContext.chain } },
                        create: {
                            id: itemId,
                            chain: networkContext.chain,
                            poolId: pool.id,
                            apr: userApr,
                            title: aprItem.title,
                            group: aprItem.group,
                        },
                        update: { apr: userApr, title: aprItem.title },
                    });
                }
            }
        }
    }
}
