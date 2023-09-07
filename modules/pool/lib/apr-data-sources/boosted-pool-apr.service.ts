import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithTokens, prismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { collectsYieldFee } from '../pool-utils';
import { networkContext } from '../../../network/network-context.service';

export class BoostedPoolAprService implements PoolAprService {
    public getAprServiceName(): string {
        return 'BoostedPoolAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
        // need to do multiple queries otherwise the nesting is too deep for many pools. Error: stack depth limit exceeded
        const boostedPools = pools.filter((pool) => pool.type === 'PHANTOM_STABLE' || pool.type === 'WEIGHTED');

        const boostedPoolsWithNestedPool = await prisma.prismaPool.findMany({
            where: { chain: networkContext.chain, id: { in: boostedPools.map((pool) => pool.id) } },
            include: {
                tokens: {
                    orderBy: { index: 'asc' },
                    include: {
                        nestedPool: true,
                    },
                },
            },
        });

        const filteredBoostedPools = boostedPoolsWithNestedPool.filter((pool) =>
            pool.tokens.find((token) => token.nestedPool),
        );

        const filteredBoostedPoolsExpanded = await prisma.prismaPool.findMany({
            where: { chain: networkContext.chain, id: { in: filteredBoostedPools.map((pool) => pool.id) } },
            include: {
                dynamicData: true,
                tokens: {
                    orderBy: { index: 'asc' },
                    include: {
                        dynamicData: true,
                        nestedPool: true,
                        token: true,
                    },
                },
            },
        });

        for (const pool of filteredBoostedPoolsExpanded) {
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
                    type: { in: ['LINEAR_BOOSTED', 'PHANTOM_STABLE_BOOSTED', 'IB_YIELD', 'SWAP_FEE'] },
                    chain: networkContext.chain,
                },
            });

            for (const token of tokens) {
                const tokenAprItems = aprItems.filter((item) => item.poolId === token.nestedPoolId);

                if (
                    !pool.dynamicData ||
                    !token.dynamicData ||
                    !token.nestedPool ||
                    !token.nestedPool.type ||
                    token.dynamicData.balanceUSD === 0 ||
                    pool.dynamicData.totalLiquidity === 0
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
                        token.nestedPool.type !== 'PHANTOM_STABLE' &&
                        // nested tokens/bpts that dont have a rate provider, we don't take any fees
                        token.dynamicData.priceRate !== '1.0'
                    ) {
                        userApr = apr * (1 - protocolYieldFeePercentage);
                    }

                    const title = aprItem.type === 'SWAP_FEE' ? `${token.token.symbol} APR` : aprItem.title;

                    await prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: itemId, chain: networkContext.chain } },
                        create: {
                            id: itemId,
                            chain: networkContext.chain,
                            poolId: pool.id,
                            apr: userApr,
                            title: title,
                            group: aprItem.group,
                        },
                        update: { apr: userApr, title: title },
                    });
                }
            }
        }
    }
}
