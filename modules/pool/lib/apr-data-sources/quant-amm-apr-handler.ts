import _ from 'lodash';
import { prisma } from '../../../../prisma/prisma-client';
import { PoolForAPRs } from '../../../../prisma/prisma-types';
import { PoolAprService } from '../../pool-types';
import moment from 'moment';
import { Prisma, PrismaTokenPrice, PrismaTokenTypeOption, PrismaPoolEvent, PrismaPool } from '@prisma/client';
import { en } from '@faker-js/faker';

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
        const midnightMay13th = moment('2023-05-13T00:00:00Z').unix();

        const prices = await prisma.prismaTokenPrice.findMany({
            where: {
                tokenAddress: { in: uniqueTokensToPrice },
                chain: chain,
                timestamp: { gte: Math.max(midnightOneMonthAgo, midnightMay13th) },
            },
            orderBy: { timestamp: 'asc' },
        });

        const currentPrices = await prisma.prismaTokenCurrentPrice.findMany({
            where: {
                tokenAddress: { in: uniqueTokensToPrice },
                chain: chain,
            },
        });

        if (currentPrices.length !== uniqueTokensToPrice.length) {
            console.error(
                `Quant AMM APR: Missing current prices for ${
                    uniqueTokensToPrice.length - currentPrices.length
                } tokens on chain ${chain}`,
            );
        }

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
            for (let i = 0; i < poolPrices.length; i++) {
                const poolPrice = poolPrices[i];
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

            const oldestEntryPoolPrice = poolPrices[0];

            const startLpPrice = pricesByTimestamp[oldestEntryPoolPrice.timestamp].filter(
                (price) => price.tokenAddress === pool.address.toLowerCase(),
            )[0];
            const endTokenPrices = currentPrices.filter(
                (price) =>
                    price.tokenAddress !== pool.address.toLowerCase() &&
                    poolTokenAddresses.includes(price.tokenAddress),
            );
            const endLpPrice = currentPrices.filter((price) => price.tokenAddress === pool.address.toLowerCase())[0];

            const weight = 1 / pool.tokens.length;

            if (startTokenPrices.length !== endTokenPrices.length) {
                console.error(
                    `Quant AMM APR: Mismatched price data for pool ${pool.id} on chain ${chain}. Start prices: ${startTokenPrices.length}, End prices: ${endTokenPrices.length}`,
                );
                continue;
            }

            if (endTokenPrices.length === 0) {
                console.error(`Quant AMM APR: No end prices found for pool ${pool.id} on chain ${chain}.`);
            }

            const priceRatios = endTokenPrices.map((end, i) => end.price / startTokenPrices[i].price);

            const endWeightedValue =
                startLpPrice.price * priceRatios.reduce((acc, ratio) => acc * Math.pow(ratio, weight), 1);

            const relativeReturn = endLpPrice.price / endWeightedValue - 1;

            const totalYearlyReturn = relativeReturn * 12;
            const apr = totalYearlyReturn / pool.dynamicData.totalLiquidity;

            await prisma.prismaPoolAprItem.upsert({
                where: { id_chain: { id: `${pool.id}-quant-amm-apr`, chain: chain } },
                update: { apr: relativeReturn },
                create: {
                    id: `${pool.id}-quant-amm-apr`,
                    chain: chain,
                    poolId: pool.id,
                    apr: relativeReturn,
                    title: 'Quant AMM APR',
                    type: 'QUANT_AMM_UPLIFT',
                    group: null,
                },
            });
        }
    }
}
