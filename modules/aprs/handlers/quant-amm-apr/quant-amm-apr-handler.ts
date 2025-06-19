import _ from 'lodash';
import { prisma } from '../../../../prisma/prisma-client';
import moment from 'moment';
import { PrismaPoolAprItem, PrismaTokenPrice } from '@prisma/client';
import { AprHandler, PoolAPRData } from '../../types';

export class QuantAmmAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'QuantAmmAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const quantAmmPools = pools.filter((pool) => pool.type === 'QUANT_AMM_WEIGHTED');

        const aprItems: Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[] = [];

        if (quantAmmPools.length === 0) {
            return aprItems;
        }
        const chain = quantAmmPools[0].chain;

        const poolAddresses = pools.map((pool) => pool.address.toLowerCase());

        const tokensToPrice = pools
            .map((pool) => {
                return pool.tokens.map((token) => token.address.toLowerCase());
            })
            .flat();

        const uniqueTokensToPrice = _.uniq([...tokensToPrice, ...poolAddresses]);

        const midnightOneMonthAgo = moment().utc().startOf('day').subtract(30, 'days').unix();

        const prices = await prisma.prismaTokenPrice.findMany({
            where: {
                tokenAddress: { in: uniqueTokensToPrice },
                chain: chain,
                timestamp: { gte: midnightOneMonthAgo },
            },
            orderBy: { timestamp: 'asc' },
        });

        const currentPrices = await prisma.prismaTokenCurrentPrice.findMany({
            where: {
                tokenAddress: { in: uniqueTokensToPrice },
                chain: chain,
            },
        });

        const pricesByToken = _.groupBy(prices, 'tokenAddress');
        const pricesByTimestamp = _.groupBy(prices, 'timestamp');

        for (const pool of pools) {
            const poolPrices = pricesByToken[pool.address.toLowerCase()];

            if (!poolPrices || poolPrices.length === 0 || !pool.dynamicData?.totalLiquidity) {
                continue;
            }

            const poolTokenAddresses = pool.tokens.map((token) => token.address.toLowerCase());

            // find oldest timestamp that has all prices
            let startTokenPrices: PrismaTokenPrice[] = [];
            let oldestIndexForAllPrices = 0;
            for (oldestIndexForAllPrices = 0; oldestIndexForAllPrices < poolPrices.length; oldestIndexForAllPrices++) {
                const poolPrice = poolPrices[oldestIndexForAllPrices];
                const foundPrices = pricesByTimestamp[poolPrice.timestamp].filter(
                    (price) =>
                        price.tokenAddress !== pool.address.toLowerCase() &&
                        poolTokenAddresses.includes(price.tokenAddress),
                );
                if (foundPrices.length === poolTokenAddresses.length) {
                    startTokenPrices = foundPrices;
                    break;
                }
            }

            if (startTokenPrices.length === 0) {
                console.error(`Quant AMM APR: No start prices found for pool ${pool.id} on chain ${chain}.`);
                continue;
            }

            const oldestEntryPoolPrice = poolPrices[oldestIndexForAllPrices];

            const startLpPrice = oldestEntryPoolPrice;

            const endTokenPrices = currentPrices.filter(
                (price) =>
                    price.tokenAddress !== pool.address.toLowerCase() &&
                    poolTokenAddresses.includes(price.tokenAddress),
            );

            if (endTokenPrices.length === 0) {
                console.error(`Quant AMM APR: No end prices found for pool ${pool.id} on chain ${chain}.`);
            }

            if (startTokenPrices.length !== endTokenPrices.length) {
                console.error(
                    `Quant AMM APR: Mismatched price data for pool ${pool.id} on chain ${chain}. Start prices: ${startTokenPrices.length}, End prices: ${endTokenPrices.length}`,
                );
                continue;
            }

            const endLpPrice = currentPrices.filter((price) => price.tokenAddress === pool.address.toLowerCase())[0];

            if (!endLpPrice) {
                console.error(`Quant AMM APR: No end LP price found for pool ${pool.id} on chain ${chain}.`);
            }

            const weight = 1 / pool.tokens.length;

            const sortedStartTokenPrices = _.sortBy(startTokenPrices, (price) => price.tokenAddress);
            const sortedEndTokenPrices = _.sortBy(endTokenPrices, (price) => price.tokenAddress);

            const priceRatios = sortedEndTokenPrices.map((end, i) => end.price / sortedStartTokenPrices[i].price);

            const endWeightedValue =
                startLpPrice.price * priceRatios.reduce((acc, ratio) => acc * Math.pow(ratio, weight), 1);

            const relativeReturn = endLpPrice.price / endWeightedValue - 1;

            const totalYearlyReturn = relativeReturn * 12;

            aprItems.push({
                id: `${pool.id}-quant-amm-apr`,
                chain: chain,
                poolId: pool.id,
                apr: totalYearlyReturn,
                title: 'Quant AMM APR',
                type: 'QUANT_AMM_UPLIFT',
                rewardTokenAddress: null,
                rewardTokenSymbol: null,
            });
        }

        return aprItems;
    }
}
