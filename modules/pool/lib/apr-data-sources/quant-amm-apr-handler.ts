import _ from 'lodash';
import { prisma } from '../../../../prisma/prisma-client';
import { PrismaPoolWithTokens } from '../../../../prisma/prisma-types';
import { PoolAprService } from '../../pool-types';
import { Chain } from '@prisma/client';
import { chainToChainId } from '../../../network/chain-id-to-chain';
import moment from 'moment';

export class QuantAmmAprService implements PoolAprService {
    public getAprServiceName(): string {
        return 'QuantAmmAprServices';
    }

    public async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
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

        const prices = await prisma.prismaTokenPrice.findMany({
            where: { tokenAddress: { in: uniqueTokensToPrice }, chain: chain, timestamp: { gte: midnightOneMonthAgo } },
            orderBy: { timestamp: 'asc' },
        });

        const pricesByToken = _.groupBy(prices, 'tokenAddress');
        const pricesByTimestamp = _.groupBy(prices, 'timestamp');

        for (const pool of poolsExpanded) {
            const poolPrices = pricesByToken[pool.address.toLowerCase()];

            if (!poolPrices || poolPrices.length === 0 || !pool.dynamicData?.totalLiquidity) {
                continue;
            }

            const oldestEntry = poolPrices[0];
            const newestEntry = poolPrices[poolPrices.length - 1];

            const startTokenPrices = pricesByTimestamp[oldestEntry.timestamp].filter(
                (price) => price.tokenAddress !== pool.address.toLowerCase(),
            );
            const startLpPrice = pricesByTimestamp[oldestEntry.timestamp].filter(
                (price) => price.tokenAddress === pool.address.toLowerCase(),
            )[0];
            const endTokenPrices = pricesByTimestamp[newestEntry.timestamp].filter(
                (price) => price.tokenAddress !== pool.address.toLowerCase(),
            );
            const endLpPrice = pricesByTimestamp[newestEntry.timestamp].filter(
                (price) => price.tokenAddress === pool.address.toLowerCase(),
            )[0];

            const weight = 1 / pool.tokens.length;

            if (startTokenPrices.length !== endTokenPrices.length) {
                console.error(
                    `Quant AMM APR: Mismatched price data for pool ${pool.id} on chain ${chain}. Start prices: ${startTokenPrices.length}, End prices: ${endTokenPrices.length}`,
                );
                continue;
            }

            const priceRatios = endTokenPrices.map((end, i) => end.price / startTokenPrices[i].price);

            const endWeightedValue =
                startLpPrice.price * priceRatios.reduce((acc, ratio) => acc * Math.pow(ratio, weight), 1);

            const relativeReturn = endLpPrice.price / endWeightedValue - 1;

            const totalYearlyReturn = relativeReturn * 12;
            const apr = totalYearlyReturn / pool.dynamicData.totalLiquidity;

            await prisma.prismaPoolAprItem.upsert({
                where: { id_chain: { id: `${pool.id}-quant-amm-apr`, chain: chain } },
                update: { apr: totalYearlyReturn / pool.dynamicData?.totalLiquidity },
                create: {
                    id: `${pool.id}-quant-amm-apr`,
                    chain: chain,
                    poolId: pool.id,
                    apr: apr,
                    title: 'Quant AMM APR',
                    type: 'QUANT_AMM_UPLIFT',
                    group: null,
                },
            });
        }
    }
}
