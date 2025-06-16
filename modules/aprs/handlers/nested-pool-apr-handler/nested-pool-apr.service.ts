import { prisma } from '../../../../prisma/prisma-client';
import { collectsYieldFee } from '../../../pool/lib/pool-utils';
import { AprHandler, PoolAPRData } from '../../types';
import { PrismaPoolAprItem } from '@prisma/client';

export class NestedPoolAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'NestedPoolAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        for (const pool of pools) {
            const protocolYieldFeePercentage = parseFloat(pool.dynamicData?.protocolYieldFee || '0');
            const tokens = pool.tokens.filter((token) => {
                // exclude the phantom bpt pool token itself
                if (token.address === pool.address) {
                    return false;
                }
            });

            const poolIds = tokens.map((token) => token.nestedPool?.id || '');
            // swap fee and IB yield is also earned on the parent pool
            const aprItems = await prisma.prismaPoolAprItem.findMany({
                where: {
                    poolId: { in: poolIds },
                    type: { in: ['IB_YIELD', 'SWAP_FEE_24H'] },
                    chain: pool.chain,
                },
            });

            for (const token of tokens) {
                const tokenAprItems = aprItems.filter((item) => item.poolId === token.nestedPoolId);

                if (
                    !pool.dynamicData ||
                    !token.nestedPool ||
                    !token.nestedPool.type ||
                    token.balanceUSD === 0 ||
                    pool.dynamicData.totalLiquidity === 0
                ) {
                    continue;
                }

                for (const aprItem of tokenAprItems) {
                    const itemId = `${pool.id}-${aprItem.id}`;
                    //scale the apr as a % of total liquidity

                    const apr = aprItem.apr * (token.balanceUSD / pool.dynamicData.totalLiquidity);
                    let userApr = apr;

                    if (
                        collectsYieldFee(pool) &&
                        // nested tokens/bpts that dont have a rate provider, we don't take any fees
                        token.priceRate !== '1.0'
                    ) {
                        userApr = userApr * (1 - protocolYieldFeePercentage);
                    }

                    const title = aprItem.type === 'SWAP_FEE_24H' ? `${token.token.symbol} APR` : aprItem.title;

                    aprItems.push({
                        id: itemId,
                        chain: pool.chain,
                        poolId: pool.id,
                        apr: userApr,
                        title: title,
                        type: aprItem.type,
                        rewardTokenAddress: aprItem.rewardTokenAddress,
                        rewardTokenSymbol: aprItem.rewardTokenSymbol,
                    });
                }
            }
        }
        return aprItems;
    }
}
