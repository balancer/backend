import { PoolAprService } from '../../../pool-types';
import { PrismaPoolWithExpandedNesting, PrismaPoolWithTokens } from '../../../../../prisma/prisma-types';
import axios from 'axios';
import { prisma } from '../../../../../prisma/prisma-client';
import { TokenService } from '../../../../token/token.service';
import { networkContext } from '../../../../network/network-context.service';
import { liquidStakedBaseAprService } from '../liquid-staked-base-apr.service';

const BOO_TOKEN_ADDRESS = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE'.toLowerCase();

export class SpookySwapAprService implements PoolAprService {
    constructor(private readonly tokenService: TokenService, private readonly booAddress: string) {}

    public getAprServiceName(): string {
        return 'SpookySwapAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
        const tokenPrices = await this.tokenService.getTokenPrices();
        const xBooBaseApr = await liquidStakedBaseAprService.getXBooBaseApr();

        const expandedSpookyPools = await prisma.prismaPool.findMany({
            where: { chain: networkContext.chain, id: { in: pools.map((pool) => pool.id) } },
            include: {
                dynamicData: true,
                linearData: true,
                tokens: {
                    orderBy: { index: 'asc' },
                    include: {
                        dynamicData: true,
                        token: true,
                    },
                },
            },
        });

        let operations: any[] = [];

        for (const pool of expandedSpookyPools) {
            if (
                !pool.linearData ||
                !pool.dynamicData ||
                pool.tokens[pool.linearData.mainIndex].address !== this.booAddress
            ) {
                continue;
            }

            const linearData = pool.linearData;
            const wrappedToken = pool.tokens[linearData.wrappedIndex];
            const tokenPrice = this.tokenService.getPriceForToken(tokenPrices, this.booAddress);
            const wrappedTokens = parseFloat(wrappedToken.dynamicData?.balance || '0');
            const priceRate = parseFloat(wrappedToken.dynamicData?.priceRate || '1.0');
            const poolWrappedLiquidity = wrappedTokens * priceRate * tokenPrice;
            const totalLiquidity = pool.dynamicData.totalLiquidity;
            const apr = totalLiquidity > 0 ? xBooBaseApr * (poolWrappedLiquidity / totalLiquidity) : 0;

            operations.push(
                prisma.prismaPoolAprItem.upsert({
                    where: { id_chain: { id: `${pool.id}-xboo-apr`, chain: networkContext.chain } },
                    update: { apr, type: 'LINEAR_BOOSTED' },
                    create: {
                        id: `${pool.id}-xboo-apr`,
                        chain: networkContext.chain,
                        poolId: pool.id,
                        apr,
                        title: 'xBOO boosted APR',
                        type: 'LINEAR_BOOSTED',
                    },
                }),
            );
        }

        await Promise.all(operations);
    }
}
