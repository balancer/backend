import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithTokens, prismaPoolWithExpandedNesting } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { collectsYieldFee } from '../pool-utils';
import { Chain } from '@prisma/client';

export class PhantomStableAprService implements PoolAprService {
    constructor(private chain: Chain, private defaultProtocolFee: number) {}

    public getAprServiceName(): string {
        return 'PhantomStableAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
        const phantomStablePools = pools.filter((pool) => pool.type === 'PHANTOM_STABLE');

        const phantomStablePoolsExpanded = await prisma.prismaPool.findMany({
            ...prismaPoolWithExpandedNesting,
            where: { chain: this.chain, id: { in: phantomStablePools.map((pool) => pool.id) } },
        });

        for (const pool of phantomStablePoolsExpanded) {
            const protocolYieldFeePercentage = pool.dynamicData?.protocolYieldFee
                ? parseFloat(pool.dynamicData.protocolYieldFee)
                : this.defaultProtocolFee;
            const linearPoolTokens = pool.tokens.filter((token) => token.nestedPool?.type === 'LINEAR');
            const linearPoolIds = linearPoolTokens.map((token) => token.nestedPool?.id || '');
            const aprItems = await prisma.prismaPoolAprItem.findMany({
                where: { poolId: { in: linearPoolIds }, type: 'LINEAR_BOOSTED', chain: this.chain },
            });

            for (const token of linearPoolTokens) {
                const aprItem = aprItems.find((item) => item.poolId === token.nestedPoolId);

                if (aprItem && token.dynamicData && pool.dynamicData && token.dynamicData.balanceUSD > 0) {
                    const itemId = `${pool.id}-${token.token.address}-${token.index}`;
                    const apr = aprItem.apr * (token.dynamicData.balanceUSD / pool.dynamicData.totalLiquidity);
                    const userApr = collectsYieldFee(pool) ? apr * (1 - protocolYieldFeePercentage) : apr;

                    await prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: itemId, chain: this.chain } },
                        create: {
                            id: itemId,
                            chain: this.chain,
                            poolId: pool.id,
                            apr: userApr,
                            title: aprItem.title,
                            group: aprItem.group,
                            type: 'PHANTOM_STABLE_BOOSTED',
                        },
                        update: { apr: userApr, title: aprItem.title, type: 'PHANTOM_STABLE_BOOSTED' },
                    });
                }
            }
        }
    }
}
