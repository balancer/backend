import { TokenPriceHandler, TokenPriceItem } from '../token-types';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { timestampRoundedUpToNearestHour } from '../../common/time';
import { Chain, PrismaTokenCurrentPrice, PrismaTokenPrice } from '@prisma/client';
import moment from 'moment-timezone';
import { GqlTokenChartDataRange } from '../../../schema';
import { Cache, CacheClass } from 'memory-cache';
import * as Sentry from '@sentry/node';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';
import { FbeetsPriceHandlerService } from './token-price-handlers/fbeets-price-handler.service';
import { ClqdrPriceHandlerService } from './token-price-handlers/clqdr-price-handler.service';
import { CoingeckoPriceHandlerService } from './token-price-handlers/coingecko-price-handler.service';
import { FallbackHandlerService } from './token-price-handlers/fallback-price-handler.service';
import { LinearWrappedTokenPriceHandlerService } from './token-price-handlers/linear-wrapped-token-price-handler.service';
import { BptPriceHandlerService } from './token-price-handlers/bpt-price-handler.service';
import { SwapsPriceHandlerService } from './token-price-handlers/swaps-price-handler.service';
import { PrismaTokenWithTypes } from '../../../prisma/prisma-types';

export class TokenPriceService {
    cache: CacheClass<string, any> = new Cache<string, any>();
    private readonly priceHandlers: TokenPriceHandler[] = [
        new FbeetsPriceHandlerService(),
        new ClqdrPriceHandlerService(),
        new CoingeckoPriceHandlerService(),
        new BptPriceHandlerService(),
        new LinearWrappedTokenPriceHandlerService(),
        new SwapsPriceHandlerService(),
        new FallbackHandlerService(),
    ];

    public async getWhiteListedCurrentTokenPrices(chains: Chain[]): Promise<PrismaTokenCurrentPrice[]> {
        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            orderBy: { timestamp: 'desc' },
            distinct: ['tokenAddress'],
            where: {
                chain: { in: chains },
                token: { types: { some: { type: 'WHITE_LISTED' } } },
            },
        });

        for (const chain of chains) {
            const wethPrice = tokenPrices.find(
                (tokenPrice) => tokenPrice.tokenAddress === AllNetworkConfigsKeyedOnChain[chain].data.weth.address,
            );

            if (wethPrice) {
                tokenPrices.push({
                    ...wethPrice,
                    tokenAddress: AllNetworkConfigsKeyedOnChain[chain].data.eth.address,
                });
            }
        }

        return tokenPrices;
    }

    public async getCurrentTokenPrices(chains: Chain[]): Promise<PrismaTokenCurrentPrice[]> {
        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            where: { chain: { in: chains } },
            orderBy: { timestamp: 'desc' },
            distinct: ['tokenAddress'],
        });

        // also add ETH price (0xeee..)
        this.addNativeEthPrice(chains, tokenPrices);

        return tokenPrices.filter((tokenPrice) => tokenPrice.price > 0.000000001);
    }

    public async getTokenPricesFrom24hAgo(chains: Chain[]): Promise<PrismaTokenCurrentPrice[]> {
        const oneDayAgo = moment().subtract(24, 'hours').unix();
        const twoDaysAgo = moment().subtract(48, 'hours').unix();
        console.time(`TokenPrice load 24hrs ago - ${chains}`);
        const tokenPrices = await prisma.prismaTokenPrice.findMany({
            orderBy: { timestamp: 'desc' },
            where: { timestamp: { lte: oneDayAgo, gte: twoDaysAgo }, chain: { in: chains } },
        });

        const distinctTokenPrices = tokenPrices.filter(
            (price, i, self) =>
                self.findIndex((t) => t.tokenAddress === price.tokenAddress && t.chain === price.chain) === i,
        );

        console.timeEnd(`TokenPrice load 24hrs ago - ${chains}`);

        // also add ETH price (0xeee..)
        this.addNativeEthPrice(chains, distinctTokenPrices);

        return distinctTokenPrices
            .filter((tokenPrice) => tokenPrice.price > 0.000000001)
            .map((tokenPrice) => ({
                id: `${tokenPrice.tokenAddress}-${tokenPrice.timestamp}`,
                ...tokenPrice,
                updatedBy: null,
            }));
    }

    public getPriceForToken(tokenPrices: PrismaTokenCurrentPrice[], tokenAddress: string, chain: Chain): number {
        const tokenPrice = tokenPrices.find(
            (tokenPrice) =>
                tokenPrice.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() && tokenPrice.chain === chain,
        );

        return tokenPrice?.price || 0;
    }

    // TODO redo this to use DB prices for multiple chains
    // public async getHistoricalTokenPrices(chain: Chain): Promise<TokenHistoricalPrices> {
    //     const memCached = this.cache.get(
    //         `${TOKEN_HISTORICAL_PRICES_CACHE_KEY}:${chain}`,
    //     ) as TokenHistoricalPrices | null;

    //     if (memCached) {
    //         return memCached;
    //     }

    //     const tokenPrices: TokenHistoricalPrices = await this.cache.get(
    //         `${TOKEN_HISTORICAL_PRICES_CACHE_KEY}:${chain}`,
    //     );
    //     const nestedBptPrices: TokenHistoricalPrices = await this.cache.get(
    //         `${NESTED_BPT_HISTORICAL_PRICES_CACHE_KEY}:${chain}`,
    //     );

    //     if (tokenPrices) {
    //         this.cache.put(
    //             `${TOKEN_HISTORICAL_PRICES_CACHE_KEY}:${chain}`,
    //             { ...tokenPrices, ...nestedBptPrices },
    //             60000,
    //         );
    //     }

    //     //don't try to refetch the cache, it takes way too long
    //     return { ...tokenPrices, ...nestedBptPrices };
    // }

    // should this be called for all chains in general?
    // thinking about coingecko requests as we should update those prices once for all chains
    public async updateAllTokenPrices(chains: Chain[]): Promise<void> {
        const tokens = await prisma.prismaToken.findMany({
            where: { chain: { in: chains } },
            include: {
                types: true,
            },
        });

        let tokensWithTypes = tokens.map((token) => ({
            ...token,
            types: token.types.map((type) => type.type),
        }));

        for (const handler of this.priceHandlers) {
            // const accepted = await handler.getAcceptedTokens(tokensWithTypes);
            // const acceptedTokens = tokensWithTypes.filter((token) => accepted.includes(token.address));
            let updated: PrismaTokenWithTypes[] = [];

            try {
                updated = await handler.updatePricesForTokens(tokensWithTypes, chains);
            } catch (e) {
                console.error(`TokenPriceHanlder failed. ID: ${handler.id}, Error: ${e}`);
                Sentry.captureException(e, (scope) => {
                    scope.setTag('handler.exitIfFails', handler.exitIfFails);
                    return scope;
                });
                if (handler.exitIfFails) {
                    throw e;
                }
            }

            //remove any updated tokens from the list for the next handler
            tokensWithTypes = tokensWithTypes.filter((token) => {
                return !updated.some((updatedToken) => {
                    return token.address === updatedToken.address && token.chain === updatedToken.chain;
                });
            });
        }

        for (const chain of chains) {
            await this.updateCandleStickData(chain);
        }

        //we only keep token prices for the last 24 hours
        //const yesterday = moment().subtract(1, 'day').unix();
        //await prisma.prismaTokenPrice.deleteMany({ where: { timestamp: { lt: yesterday } } });
    }

    public async getDataForRange(
        tokenAddress: string,
        range: GqlTokenChartDataRange,
        chain: Chain,
    ): Promise<PrismaTokenPrice[]> {
        const startTimestamp = this.getStartTimestampFromRange(range);

        return prisma.prismaTokenPrice.findMany({
            where: { tokenAddress, timestamp: { gt: startTimestamp }, chain: chain },
            orderBy: { timestamp: 'asc' },
        });
    }

    public async getRelativeDataForRange(
        tokenIn: string,
        tokenOut: string,
        range: GqlTokenChartDataRange,
        chain: Chain,
    ): Promise<TokenPriceItem[]> {
        const startTimestamp = this.getStartTimestampFromRange(range);

        const data = await prisma.prismaTokenPrice.findMany({
            where: {
                chain: chain,
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
        chain,
    }: {
        tokenAddress: string;
        timestamp: number;
        chain: Chain;
    }): Promise<boolean> {
        const response = await prisma.prismaTokenPrice.delete({
            where: { tokenAddress_timestamp_chain: { tokenAddress, timestamp, chain: chain } },
        });

        return !!response;
    }

    private getStartTimestampFromRange(range: GqlTokenChartDataRange): number {
        switch (range) {
            case 'SEVEN_DAY':
                return moment().subtract(7, 'days').unix();
            case 'THIRTY_DAY':
                return moment().subtract(30, 'days').unix();
            case 'NINETY_DAY':
                return moment().subtract(90, 'days').unix();
            default:
                return moment().subtract(7, 'days').unix();
        }
    }

    public async purgeOldTokenPricesForAllChains(): Promise<number> {
        // DATE(to_timestamp(timestamp)) will return the midnight timestamp. We'll delete all prices that are not midnight timestamps AND are older than 100 days.
        const deleted =
            await prisma.$executeRaw`DELETE FROM "PrismaTokenPrice" WHERE DATE(to_timestamp(timestamp)) != to_timestamp(timestamp) AND to_timestamp(timestamp) < CURRENT_DATE - INTERVAL '100 days'`;

        return deleted;
    }

    private async updateCandleStickData(chain: Chain) {
        const timestamp = timestampRoundedUpToNearestHour();
        const tokenPrices = await prisma.prismaTokenPrice.findMany({
            where: { timestamp, chain: chain },
        });
        let operations: any[] = [];

        for (const tokenPrice of tokenPrices) {
            operations.push(
                prisma.prismaTokenPrice.update({
                    where: {
                        tokenAddress_timestamp_chain: {
                            tokenAddress: tokenPrice.tokenAddress,
                            timestamp,
                            chain: chain,
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

    private addNativeEthPrice(chains: Chain[], tokenPrices: { tokenAddress: string; chain: Chain }[]) {
        for (const chain of chains) {
            const wethPrice = tokenPrices.find(
                (tokenPrice) =>
                    tokenPrice.tokenAddress === AllNetworkConfigsKeyedOnChain[chain].data.weth.address &&
                    tokenPrice.chain === chain,
            );

            if (wethPrice) {
                tokenPrices.push({
                    ...wethPrice,
                    tokenAddress: AllNetworkConfigsKeyedOnChain[chain].data.eth.address,
                });
            }
        }
    }
}
