import { Chain, PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { TokenApr, YbAprConfig } from './types';
import { PoolAPRData, AprHandler } from '../../types';
import { collectsYieldFee, tokenCollectsYieldFee } from '../../../pool/lib/pool-utils';
import { YbAprHandlers } from './yb-apr-handlers';

/**
 * Calculator for yield-bearing tokens APR
 * This calculates the APR for various yield-bearing tokens in pools
 */
export class YbTokensAprHandler implements AprHandler {
    private ybTokensAprHandlers: YbAprHandlers;

    constructor(private aprConfig: YbAprConfig, chain: Chain) {
        console.log('YbTokensAprHandler initialized with config:', aprConfig);
        this.ybTokensAprHandlers = new YbAprHandlers(this.aprConfig, chain);
    }

    public getAprServiceName(): string {
        return 'YbTokensAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        // Fetch APRs for all yield-bearing tokens
        const aprs = await this.fetchYieldTokensApr();
        const aprKeysLowercase = Array.from(aprs.keys()).map((key) => key.toLowerCase());
        const aprKeysLowercaseSet = new Set(aprKeysLowercase);

        // Filter pools that contain yield-bearing tokens
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

        // Process each pool with yield-bearing tokens
        for (const pool of poolsWithYbTokens) {
            if (!pool.dynamicData) {
                continue;
            }

            const totalLiquidity = pool.dynamicData?.totalLiquidity;
            if (!totalLiquidity) {
                continue;
            }

            // Calculate APR for each token in the pool
            const tokenAprs = pool.tokens.map((token) => {
                const tokenApr = aprs.get(token.address);

                // Wrapper + underlying case, apply underlying token APR on top of the lending protocol market APR
                const underlyingApr = aprs.get(token.token.underlyingTokenAddress?.toLowerCase() || '');

                let apr = tokenApr?.apr || 0;
                if (underlyingApr) {
                    apr = (1 + apr) * (1 + underlyingApr.apr) - 1;
                }

                return {
                    ...token,
                    apr,
                    share: token.balanceUSD / totalLiquidity,
                };
            });

            // Create APR items for each token with a non-zero APR
            for (const token of tokenAprs) {
                if (!token.apr || !token.share) {
                    continue;
                }

                let userApr = token.apr * token.share;

                // Apply yield fee if applicable
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

                aprItems.push({
                    id: itemId,
                    chain: pool.chain,
                    poolId: pool.id,
                    title: `${token.token.symbol} APR`,
                    apr: userApr,
                    type: yieldType,
                    rewardTokenAddress: token.address,
                    rewardTokenSymbol: token.token.symbol,
                });
            }
        }

        return aprItems;
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
