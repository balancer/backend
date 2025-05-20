import { PoolAprService } from '../../pool-types';
import { PoolForAPRs } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { Chain, PrismaPoolAprItemGroup, PrismaPoolAprType } from '@prisma/client';
import { YbAprHandlers, TokenApr } from './yb-apr-handlers';
import { tokenService } from '../../../token/token.service';
import { collectsYieldFee, tokenCollectsYieldFee } from '../pool-utils';
import { YbAprConfig } from '../../../network/apr-config-types';

export class YbTokensAprService implements PoolAprService {
    private ybTokensAprHandlers: YbAprHandlers;

    constructor(private aprConfig: YbAprConfig, private chain: Chain) {
        this.ybTokensAprHandlers = new YbAprHandlers(this.aprConfig, chain);
    }

    getAprServiceName(): string {
        return 'YbTokensAprService';
    }

    public async updateAprForPools(pools: PoolForAPRs[]): Promise<void> {
        const operations: any[] = [];
        const chains = Array.from(new Set(pools.map((pool) => pool.chain)));
        const tokenPrices = await tokenService.getCurrentTokenPrices(chains).then((prices) =>
            Object.fromEntries(
                prices.map((price) => {
                    return [price.tokenAddress, price.price];
                }),
            ),
        );
        const aprs = await this.fetchYieldTokensApr();
        const aprKeysLowercase = Array.from(aprs.keys()).map((key) => key.toLowerCase());
        const aprKeysLowercaseSet = new Set(aprKeysLowercase);

        const poolsWithYbTokens = pools.filter((pool) => {
            const addresses = new Set(
                pool.tokens
                    .flatMap((token) => [
                        token.token.underlyingTokenAddress?.toLowerCase(),
                        token.address.toLowerCase(),
                    ])
                    .filter((address): address is string => address !== null && address !== undefined),
            );

            for (const address of addresses) {
                if (aprKeysLowercaseSet.has(address)) {
                    return true;
                }
            }
            return false;
        });

        for (const pool of poolsWithYbTokens) {
            if (!pool.dynamicData) {
                continue;
            }
            const totalLiquidity = pool.dynamicData?.totalLiquidity;
            if (!totalLiquidity) {
                continue;
            }

            const tokenAprs = pool.tokens.map((token) => {
                const tokenApr = aprs.get(token.address);

                // Wrapper + underlying case, we need to apply the underlying token APR on top of the lending protocol market APR
                const underlyingApr = aprs.get(token.token.underlyingTokenAddress?.toLowerCase() || '');

                let apr = tokenApr?.apr || 0;
                if (underlyingApr) {
                    apr = (1 + apr) * (1 + underlyingApr.apr) - 1;
                }

                return {
                    ...token,
                    apr,
                    group: tokenApr?.group,
                    share: (parseFloat(token.balance) * tokenPrices[token.address]) / totalLiquidity,
                };
            });

            for (const token of tokenAprs) {
                if (!token.apr || !token.share) {
                    continue;
                }

                let userApr = token.apr * token.share;

                let fee = 0;
                if (collectsYieldFee(pool) && tokenCollectsYieldFee(token) && pool.dynamicData) {
                    fee =
                        pool.type === 'META_STABLE'
                            ? parseFloat(pool.dynamicData.protocolSwapFee || '0')
                            : pool.protocolVersion === 3
                            ? parseFloat(pool.dynamicData.aggregateYieldFee || '0.1')
                            : parseFloat(pool.dynamicData.protocolYieldFee || '0');

                    userApr = userApr * (1 - fee);
                }

                const yieldType: PrismaPoolAprType = 'IB_YIELD';

                const itemId = `${token.poolId}-${token.address}-yield-apr`;

                const data = {
                    id: itemId,
                    chain: pool.chain,
                    poolId: pool.id,
                    title: `${token.token.symbol} APR`,
                    apr: userApr,
                    group: token.group as PrismaPoolAprItemGroup,
                    type: yieldType,
                    rewardTokenAddress: token.address,
                    rewardTokenSymbol: token.token.symbol,
                };

                operations.push(
                    prisma.prismaPoolAprItem.upsert({
                        where: { id_chain: { id: itemId, chain: pool.chain } },
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
