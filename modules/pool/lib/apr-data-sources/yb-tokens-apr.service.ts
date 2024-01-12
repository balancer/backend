import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithTokens } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { Chain, PrismaPoolAprItemGroup, PrismaPoolAprType, PrismaPoolLinearData } from '@prisma/client';
import { YbAprHandlers, TokenApr } from './yb-apr-handlers';
import { tokenService } from '../../../token/token.service';
import { collectsYieldFee } from '../pool-utils';
import { YbAprConfig } from '../../../network/apr-config-types';

export class YbTokensAprService implements PoolAprService {
    private ybTokensAprHandlers: YbAprHandlers;

    constructor(
        aprConfig: YbAprConfig,
        private chain: Chain,
        private defaultYieldFee: number,
        private defaultSwapFee: number,
    ) {
        this.ybTokensAprHandlers = new YbAprHandlers(aprConfig, chain);
    }

    getAprServiceName(): string {
        return 'YbTokensAprService';
    }

    public async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
        const operations: any[] = [];
        const tokenPrices = await tokenService.getTokenPrices();
        const aprs = await this.fetchYieldTokensApr();
        const poolsWithYbTokens = pools.filter((pool) => {
            return pool.tokens.find((token) => {
                return Array.from(aprs.keys())
                    .map((key) => key.toLowerCase())
                    .includes(token.address.toLowerCase());
            });
        });

        const poolsWithYbTokensExpanded = await prisma.prismaPool.findMany({
            where: { chain: this.chain, id: { in: poolsWithYbTokens.map((pool) => pool.id) } },
            include: {
                dynamicData: true,
                tokens: {
                    orderBy: { index: 'asc' },
                    include: {
                        token: true,
                        dynamicData: true,
                    },
                },
            },
        });

        for (const pool of poolsWithYbTokensExpanded) {
            if (!pool.dynamicData) {
                continue;
            }
            const totalLiquidity = pool.dynamicData?.totalLiquidity;
            if (!totalLiquidity) {
                continue;
            }

            for (const token of pool.tokens) {
                const tokenApr = aprs.get(token.address);
                if (!tokenApr) {
                    continue;
                }

                const tokenPrice = tokenService.getPriceForToken(tokenPrices, token.address);
                const tokenBalance = token.dynamicData?.balance;

                const tokenLiquidity = tokenPrice * parseFloat(tokenBalance || '0');
                const tokenPercentageInPool = tokenLiquidity / totalLiquidity;

                if (!tokenApr || !tokenPercentageInPool) {
                    continue;
                }

                let aprInPoolAfterFees = tokenApr.apr * tokenPercentageInPool;

                if (collectsYieldFee(pool) && token.dynamicData && token.dynamicData.priceRate !== '1.0') {
                    const protocolYieldFeePercentage = pool.dynamicData?.protocolYieldFee
                        ? parseFloat(pool.dynamicData.protocolYieldFee)
                        : this.defaultYieldFee;
                    aprInPoolAfterFees =
                        pool.type === 'META_STABLE'
                            ? aprInPoolAfterFees * (1 - this.defaultSwapFee)
                            : aprInPoolAfterFees * (1 - protocolYieldFeePercentage);
                }

                const yieldType: PrismaPoolAprType =
                    tokenApr.isIbYield || pool.type !== 'LINEAR' ? 'IB_YIELD' : 'LINEAR_BOOSTED';

                const itemId = `${pool.id}-${token.token.symbol}-yield-apr`;

                const data = {
                    id: itemId,
                    chain: this.chain,
                    poolId: pool.id,
                    title: `${token.token.symbol} APR`,
                    apr: aprInPoolAfterFees,
                    group: tokenApr.group as PrismaPoolAprItemGroup,
                    type: yieldType,
                };

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: itemId, chain: this.chain } },
                        create: data,
                        update: data,
                    }),
                );
            }
        }
        await prismaBulkExecuteOperations(operations);
    }

    private async fetchYieldTokensApr(): Promise<Map<string, TokenApr>> {
        const data = await this.ybTokensAprHandlers.fetchAprsFromAllHandlers();
        return new Map<string, TokenApr>(
            data
                .filter((tokenApr) => {
                    return !isNaN(tokenApr.apr);
                })
                .map((apr) => [apr.address, apr]),
        );
    }
}
