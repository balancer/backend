import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithTokens } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { Chain, PrismaPoolAprItemGroup, PrismaPoolAprType } from '@prisma/client';
import { YbAprHandlers, TokenApr } from './yb-apr-handlers';
import { tokenService } from '../../../token/token.service';
import { collectsYieldFee, tokenCollectsYieldFee } from '../pool-utils';
import { YbAprConfig } from '../../../network/apr-config-types';
import { networkContext } from '../../../network/network-context.service';
import { zeroAddress } from 'viem';

export class YbTokensAprService implements PoolAprService {
    private ybTokensAprHandlers: YbAprHandlers;

    constructor(aprConfig: YbAprConfig, private chain: Chain) {
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
                // Tokens with 0 rate provider don't accrue yield
                if (token.priceRateProvider === zeroAddress) {
                    continue;
                }

                const tokenApr = aprs.get(token.address);
                if (!tokenApr) {
                    continue;
                }

                const tokenPrice = tokenService.getPriceForToken(tokenPrices, token.address, networkContext.chain);
                const tokenBalance = token.dynamicData?.balance;

                const tokenLiquidity = tokenPrice * parseFloat(tokenBalance || '0');
                const tokenPercentageInPool = tokenLiquidity / totalLiquidity;

                if (!tokenApr || !tokenPercentageInPool) {
                    continue;
                }

                let userApr = tokenApr.apr * tokenPercentageInPool;

                if (collectsYieldFee(pool) && tokenCollectsYieldFee(token) && token.dynamicData) {
                    const fee =
                        pool.type === 'META_STABLE'
                            ? parseFloat(pool.dynamicData.protocolSwapFee || '0')
                            : parseFloat(pool.dynamicData.protocolYieldFee || '0');

                    userApr = userApr * (1 - fee);
                }

                const yieldType: PrismaPoolAprType = 'IB_YIELD';

                const itemId = `${pool.id}-${token.token.symbol}-yield-apr`;

                const data = {
                    id: itemId,
                    chain: this.chain,
                    poolId: pool.id,
                    title: `${token.token.symbol} APR`,
                    apr: userApr,
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
