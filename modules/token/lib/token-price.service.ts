import { TokenPriceHandler, TokenPriceItem } from '../token-types';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { secondsPerDay, timestampRoundedUpToNearestHour } from '../../common/time';
import { PrismaTokenCurrentPrice, PrismaTokenPrice } from '@prisma/client';
import moment from 'moment-timezone';
import { GqlTokenChartDataRange } from '../../../schema';
import { Cache, CacheClass } from 'memory-cache';
import * as Sentry from '@sentry/node';
import { networkContext } from '../../network/network-context.service';
import { TokenHistoricalPrices } from '../../coingecko/coingecko-types';

const TOKEN_HISTORICAL_PRICES_CACHE_KEY = `token-historical-prices`;
const NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY = `nested-bpt-historical-prices`;

export class TokenPriceService {
    cache: CacheClass<string, any> = new Cache<string, any>();

    constructor() {}

    private get handlers(): TokenPriceHandler[] {
        return networkContext.config.tokenPriceHandlers;
    }

    public async getWhiteListedCurrentTokenPrices(): Promise<PrismaTokenCurrentPrice[]> {
        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            orderBy: { timestamp: 'desc' },
            distinct: ['tokenAddress'],
            where: {
                chain: networkContext.chain,
                token: {
                    types: { some: { type: 'WHITE_LISTED' } },
                },
            },
        });

        const wethPrice = tokenPrices.find(
            (tokenPrice) => tokenPrice.tokenAddress === networkContext.data.weth.address,
        );

        if (wethPrice) {
            tokenPrices.push({
                ...wethPrice,
                tokenAddress: networkContext.data.eth.address,
            });
        }

        return tokenPrices;
    }

    public async getCurrentTokenPrices(): Promise<PrismaTokenCurrentPrice[]> {
        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            where: { chain: networkContext.chain },
            orderBy: { timestamp: 'desc' },
            distinct: ['tokenAddress'],
        });

        const wethPrice = tokenPrices.find(
            (tokenPrice) => tokenPrice.tokenAddress === networkContext.data.weth.address,
        );

        if (wethPrice) {
            tokenPrices.push({
                ...wethPrice,
                tokenAddress: networkContext.data.eth.address,
            });
        }

        return tokenPrices.filter((tokenPrice) => tokenPrice.price > 0.000000001);
    }

    public async getTokenPriceFrom24hAgo(): Promise<PrismaTokenCurrentPrice[]> {
        const oneDayAgo = moment().subtract(24, 'hours').unix();
        const twoDaysAgo = moment().subtract(48, 'hours').unix();
        console.time(`TokenPrice load 24hrs ago - ${networkContext.chain}`);
        const tokenPrices = await prisma.prismaTokenPrice.findMany({
            orderBy: { timestamp: 'desc' },
            where: { timestamp: { lte: oneDayAgo, gte: twoDaysAgo }, chain: networkContext.chain },
        });

        const distinctTokenPrices = tokenPrices.filter(
            (price, i, self) => self.findIndex((t) => t.tokenAddress === price.tokenAddress) === i,
        );

        console.timeEnd(`TokenPrice load 24hrs ago - ${networkContext.chain}`);

        const wethPrice = distinctTokenPrices.find(
            (tokenPrice) => tokenPrice.tokenAddress === networkContext.data.weth.address,
        );

        if (wethPrice) {
            distinctTokenPrices.push({
                ...wethPrice,
                tokenAddress: networkContext.data.eth.address,
            });
        }

        return distinctTokenPrices
            .filter((tokenPrice) => tokenPrice.price > 0.000000001)
            .map((tokenPrice) => ({
                id: `${tokenPrice.tokenAddress}-${tokenPrice.timestamp}`,
                ...tokenPrice,
            }));
    }

    public getPriceForToken(tokenPrices: PrismaTokenCurrentPrice[], tokenAddress: string): number {
        const tokenPrice = tokenPrices.find(
            (tokenPrice) => tokenPrice.tokenAddress.toLowerCase() === tokenAddress.toLowerCase(),
        );

        return tokenPrice?.price || 0;
    }

    public async getHistoricalTokenPrices(): Promise<TokenHistoricalPrices> {
        const memCached = this.cache.get(
            `${TOKEN_HISTORICAL_PRICES_CACHE_KEY}:${networkContext.chainId}`,
        ) as TokenHistoricalPrices | null;

        if (memCached) {
            return memCached;
        }

        const tokenPrices: TokenHistoricalPrices = await this.cache.get(
            `${TOKEN_HISTORICAL_PRICES_CACHE_KEY}:${networkContext.chainId}`,
        );
        const nestedBptPrices: TokenHistoricalPrices = await this.cache.get(
            `${NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY}:${networkContext.chainId}`,
        );

        if (tokenPrices) {
            this.cache.put(
                `${TOKEN_HISTORICAL_PRICES_CACHE_KEY}:${networkContext.chainId}`,
                { ...tokenPrices, ...nestedBptPrices },
                60000,
            );
        }

        //don't try to refetch the cache, it takes way too long
        return { ...tokenPrices, ...nestedBptPrices };
    }

    public async updateTokenPrices(): Promise<void> {
        const tokens = await prisma.prismaToken.findMany({
            where: { chain: networkContext.chain },
            include: {
                types: true,
                //fetch the last price stored
                prices: { take: 1, orderBy: { timestamp: 'desc' } },
            },
        });

        //order by timestamp ascending, so the tokens at the front of the list are the ones with the oldest timestamp
        //this is for instances where a query gets rate limited and does not finish
        let tokensWithTypes = _.sortBy(tokens, (token) => token.prices[0]?.timestamp || 0).map((token) => ({
            ...token,
            types: token.types.map((type) => type.type),
        }));

        for (const handler of this.handlers) {
            const accepted = await handler.getAcceptedTokens(tokensWithTypes);
            const acceptedTokens = tokensWithTypes.filter((token) => accepted.includes(token.address));
            let updated: string[] = [];

            try {
                updated = await handler.updatePricesForTokens(acceptedTokens);
            } catch (e) {
                console.error(
                    `TokenPriceHanlder failed. Chain: ${networkContext.chain}, ID: ${handler.id}, Error: ${e}`,
                );
                Sentry.captureException(e, (scope) => {
                    scope.setTag('handler.exitIfFails', handler.exitIfFails);
                    return scope;
                });
                if (handler.exitIfFails) {
                    throw e;
                }
            }

            //remove any updated tokens from the list for the next handler
            tokensWithTypes = tokensWithTypes.filter((token) => !updated.includes(token.address));
        }

        await this.updateCandleStickData();

        //we only keep token prices for the last 24 hours
        //const yesterday = moment().subtract(1, 'day').unix();
        //await prisma.prismaTokenPrice.deleteMany({ where: { timestamp: { lt: yesterday } } });
    }

    public async getDataForRange(tokenAddress: string, range: GqlTokenChartDataRange): Promise<PrismaTokenPrice[]> {
        const startTimestamp = this.getStartTimestampFromRange(range);

        return prisma.prismaTokenPrice.findMany({
            where: { tokenAddress, timestamp: { gt: startTimestamp }, chain: networkContext.chain },
            orderBy: { timestamp: 'asc' },
        });
    }

    public async getRelativeDataForRange(
        tokenIn: string,
        tokenOut: string,
        range: GqlTokenChartDataRange,
    ): Promise<TokenPriceItem[]> {
        const startTimestamp = this.getStartTimestampFromRange(range);

        const data = await prisma.prismaTokenPrice.findMany({
            where: {
                chain: networkContext.chain,
                tokenAddress: { in: [tokenIn, tokenOut] },
                timestamp: { gt: startTimestamp },
            },
            orderBy: { timestamp: 'asc' },
        });

        const tokenInData = data.filter((item) => item.tokenAddress === tokenIn);
        const tokenOutData = data.filter((item) => item.tokenAddress === tokenOut);
        const items: TokenPriceItem[] = [];

        for (const tokenInItem of tokenInData) {
            const tokenOutItem = tokenOutData.find((tokenOutItem) => tokenOutItem.timestamp == tokenInItem.timestamp);

            if (tokenOutItem) {
                items.push({
                    id: `${tokenIn}-${tokenOut}-${tokenInItem.timestamp}`,
                    timestamp: tokenInItem.timestamp,
                    price: tokenInItem.close / tokenOutItem.close,
                });
            }
        }

        return items;
    }

    public async deleteTokenPrice({
        timestamp,
        tokenAddress,
    }: {
        tokenAddress: string;
        timestamp: number;
    }): Promise<boolean> {
        const response = await prisma.prismaTokenPrice.delete({
            where: { tokenAddress_timestamp_chain: { tokenAddress, timestamp, chain: networkContext.chain } },
        });

        return !!response;
    }

    private getStartTimestampFromRange(range: GqlTokenChartDataRange) {
        return moment()
            .subtract(range === 'SEVEN_DAY' ? 7 : 30, 'days')
            .unix();
    }

    public async purgeOldTokenPrices(): Promise<number> {
        const purgeBeforeTimestamp = moment()
            .startOf('day')
            .subtract(networkContext.data.tokenPrices.maxHourlyPriceHistoryNumDays, 'days')
            .utc()
            .unix();
        const oldPrices = await prisma.prismaTokenPrice.findMany({
            where: {
                chain: networkContext.chain,
                timestamp: { lt: purgeBeforeTimestamp },
            },
        });

        // returns all non midnight prices
        const tobeDeleted = oldPrices.filter((tokenPrice) => tokenPrice.timestamp % secondsPerDay !== 0);

        //apparently prisma has a limitation on delete
        const chunks = _.chunk(tobeDeleted, 1000);

        for (const chunk of chunks) {
            await prisma.prismaTokenPrice.deleteMany({
                where: {
                    chain: networkContext.chain,
                    timestamp: { in: chunk.map((tokenPrice) => tokenPrice.timestamp) },
                },
            });
        }

        return tobeDeleted.length;
    }

    private async updateCandleStickData() {
        const timestamp = timestampRoundedUpToNearestHour();
        const tokenPrices = await prisma.prismaTokenPrice.findMany({
            where: { timestamp, chain: networkContext.chain },
        });
        let operations: any[] = [];

        for (const tokenPrice of tokenPrices) {
            operations.push(
                prisma.prismaTokenPrice.update({
                    where: {
                        tokenAddress_timestamp_chain: {
                            tokenAddress: tokenPrice.tokenAddress,
                            timestamp,
                            chain: networkContext.chain,
                        },
                    },
                    data: {
                        high: Math.max(tokenPrice.high, tokenPrice.price),
                        low: Math.min(tokenPrice.low, tokenPrice.price),
                    },
                }),
            );
        }

        await Promise.all(operations);
    }
}
