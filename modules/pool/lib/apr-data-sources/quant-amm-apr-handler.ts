import _ from 'lodash';
import { prisma } from '../../../../prisma/prisma-client';
import { PoolForAPRs } from '../../../../prisma/prisma-types';
import { PoolAprService } from '../../pool-types';
import moment from 'moment';
import { PrismaTokenPrice } from '@prisma/client';

export class QuantAmmAprService implements PoolAprService {
    public getAprServiceName(): string {
        return 'QuantAmmAprServices';
    }

    public async updateAprForPools(pools: PoolForAPRs[]): Promise<void> {
        const quantAmmPools = pools.filter((pool) => pool.type === 'QUANT_AMM_WEIGHTED');

        if (quantAmmPools.length === 0) {
            return;
        }
        const chain = quantAmmPools[0].chain;

        const poolsExpanded = await prisma.prismaPool.findMany({
            where: { chain, id: { in: quantAmmPools.map((pool) => pool.id) } },
            include: {
                dynamicData: true,
                tokens: true,
            },
        });

        const poolAddresses = poolsExpanded.map((pool) => pool.address.toLowerCase());

        const tokensToPrice = poolsExpanded
            .map((pool) => {
                return pool.tokens.map((token) => token.address.toLowerCase());
            })
            .flat();

        const uniqueTokensToPrice = _.uniq([...tokensToPrice, ...poolAddresses]);

        const midnightOneMonthAgo = moment().utc().startOf('day').subtract(30, 'days').unix();

        // launch date of Quant AMM
        const quantLaunchDate = moment('2025-05-15T00:00:00Z').unix();

        const prices = await prisma.prismaTokenPrice.findMany({
            where: {
                tokenAddress: { in: uniqueTokensToPrice },
                chain: chain,
                timestamp: { gte: Math.max(midnightOneMonthAgo, quantLaunchDate) },
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

        for (const pool of poolsExpanded) {
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

            if (pool.address.toLowerCase() === '0x6b61d8680c4f9e560c8306807908553f95c749c5') {
                // nice console log for debug
                console.log(`Quant AMM APR for pool ${pool.id} on chain ${chain}`);
                console.log(`Start timestamp: ${sortedStartTokenPrices[0].timestamp}`);
                console.log(`End timestamp: ${sortedEndTokenPrices[0].timestamp}`);
                console.log(`Start LP price: ${startLpPrice.price}`);
                console.log(`End LP price: ${endLpPrice.price}`);
                console.log(`Start token prices: ${sortedStartTokenPrices.map((price) => price.price)}`);
                console.log(`End token prices: ${sortedEndTokenPrices.map((price) => price.price)}`);
                console.log(`Price ratios: ${priceRatios}`);
                console.log(`End weighted value: ${endWeightedValue}`);
                console.log(`Yearly return: ${totalYearlyReturn}`);
            }

            await prisma.prismaPoolAprItem.upsert({
                where: { id_chain: { id: `${pool.id}-quant-amm-apr`, chain: chain } },
                update: { apr: totalYearlyReturn },
                create: {
                    id: `${pool.id}-quant-amm-apr`,
                    chain: chain,
                    poolId: pool.id,
                    apr: totalYearlyReturn,
                    title: 'Quant AMM APR',
                    type: 'QUANT_AMM_UPLIFT',
                    group: null,
                },
            });
        }
    }
}
