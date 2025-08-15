/**
 * This service calculates the APR for a pool based on the gauge rewards
 *
 * Definitions:
 * The “working supply” of the gauge - the effective total LP token amount after all deposits have been boosted.
 * "Working balance" is 40% of a user balance in a gauge - used only for BAL rewards on v2 gauges on child gauges or on mainnet
 */
import { secondsPerYear } from '../../../common/time';
import { PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { TokenService, tokenService } from '../../../token/token.service';
import { AprHandler, PoolAPRData } from '../../types';

export class LiquidityGaugeAprHandler implements AprHandler {
    private readonly MAX_VEBAL_BOOST = 2.5;

    constructor(private readonly tokenService: TokenService) {}

    public getAprServiceName(): string {
        return 'LiquidityGaugeAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const chain = pools[0].chain;

        // Get the data
        const tokenPrices = await this.tokenService.getTokenPrices(chain);

        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        for (const pool of pools) {
            const gauge = pool.staking.find((s) => s.type === 'GAUGE')?.gauge;

            if (!gauge || !gauge.rewards || !pool.dynamicData || pool.dynamicData.totalShares === '0') {
                continue;
            }

            // Get token rewards per year with data needed for the DB
            const rewards = await Promise.allSettled(
                gauge.rewards.map(async ({ id, tokenAddress, rewardPerSecond, isVeBalemissions }) => {
                    const price = tokenService.getPriceForToken(tokenPrices, tokenAddress, pool.chain);
                    if (!price) {
                        return Promise.reject(`Price not found for ${tokenAddress}`);
                    }

                    let definition;
                    try {
                        definition = await prisma.prismaToken.findUniqueOrThrow({
                            where: { address_chain: { address: tokenAddress, chain: pool.chain } },
                        });
                    } catch (e) {
                        //we don't have the reward token added as a token, only happens for testing tokens
                        return Promise.reject('Definition not found');
                    }

                    return {
                        id: id,
                        address: tokenAddress,
                        symbol: definition.symbol,
                        rewardPerYear: parseFloat(rewardPerSecond) * secondsPerYear * price,
                        isVeBalemissions: isVeBalemissions,
                    };
                }),
            );

            // Calculate APRs
            const totalShares = parseFloat(pool.dynamicData.totalShares);
            const gaugeTotalShares = parseFloat(gauge.totalSupply);
            const bptPrice = pool.dynamicData.totalLiquidity / totalShares;
            const gaugeTvl = gaugeTotalShares * bptPrice;
            const workingSupply = parseFloat(gauge.workingSupply);

            for (const reward of rewards) {
                if (reward.status === 'rejected') {
                    console.error(
                        `Error: Failed to get reward data for ${gauge.id} on chain ${pool.chain}: ${reward.reason}`,
                    );
                    continue;
                }

                const { address, symbol, rewardPerYear, isVeBalemissions } = reward.value;

                const itemData: PrismaPoolAprItem = {
                    id: `${reward.value.id}-${symbol}-apr`,
                    chain: pool.chain,
                    poolId: pool.id,
                    title: `${symbol} reward APR`,
                    apr: 0,
                    rewardTokenAddress: address,
                    rewardTokenSymbol: symbol,
                    type: isVeBalemissions ? PrismaPoolAprType.VEBAL_EMISSIONS : PrismaPoolAprType.STAKING,
                };

                // veBAL rewards have a min and max, we create two items for them
                if (isVeBalemissions && (pool.chain === 'MAINNET' || gauge.version === 2)) {
                    let minApr = 0;
                    const adjustedGaugeTvl = gaugeTvl === 0 ? 1 : gaugeTvl; // Avoid division by zero
                    if (workingSupply > 0 && gaugeTotalShares > 0) {
                        minApr = (((gaugeTotalShares * 0.4) / workingSupply) * rewardPerYear) / adjustedGaugeTvl;
                    } else {
                        minApr = rewardPerYear / adjustedGaugeTvl;
                    }

                    itemData.apr = minApr;
                    aprItems.push(itemData);

                    aprItems.push({
                        id: `${itemData.id}-boost`,
                        chain: pool.chain,
                        poolId: pool.id,
                        title: `${symbol} reward APR`,
                        apr: minApr * this.MAX_VEBAL_BOOST,
                        rewardTokenAddress: address,
                        rewardTokenSymbol: symbol,
                        type: PrismaPoolAprType.STAKING_BOOST,
                    });
                } else {
                    itemData.apr = gaugeTvl > 0 ? rewardPerYear / gaugeTvl : 0;

                    aprItems.push(itemData);
                }
            }
        }
        return aprItems;
    }
}
