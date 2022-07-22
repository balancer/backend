import { TokenPriceHandler, TokenPriceItem } from '../token-types';
import { prisma } from '../../util/prisma-client';
import _ from 'lodash';
import { timestampRoundedUpToNearestHour } from '../../util/time';
import { PrismaTokenCurrentPrice, PrismaTokenPrice } from '@prisma/client';
import moment from 'moment-timezone';
import { networkConfig } from '../../config/network-config';
import { GqlTokenChartDataRange } from '../../../schema';
import { memCacheGetValueAndCacheIfNeeded } from '../../util/mem-cache';

export class TokenPriceService {
    constructor(private readonly handlers: TokenPriceHandler[]) {}

    public async getWhiteListedCurrentTokenPrices(): Promise<PrismaTokenCurrentPrice[]> {
        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            orderBy: { timestamp: 'desc' },
            distinct: ['tokenAddress'],
            where: {
                token: {
                    types: { some: { type: 'WHITE_LISTED' } },
                },
            },
        });

        const wethPrice = tokenPrices.find((tokenPrice) => tokenPrice.tokenAddress === networkConfig.weth.address);

        if (wethPrice) {
            tokenPrices.push({
                ...wethPrice,
                tokenAddress: networkConfig.eth.address,
            });
        }

        return tokenPrices.filter((tokenPrice) => tokenPrice.price > 0.000000001);
    }

    public async getCurrentTokenPrices(): Promise<PrismaTokenCurrentPrice[]> {
        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            orderBy: { timestamp: 'desc' },
            distinct: ['tokenAddress'],
        });

        const wethPrice = tokenPrices.find((tokenPrice) => tokenPrice.tokenAddress === networkConfig.weth.address);

        if (wethPrice) {
            tokenPrices.push({
                ...wethPrice,
                tokenAddress: networkConfig.eth.address,
            });
        }

        return tokenPrices.filter((tokenPrice) => tokenPrice.price > 0.000000001);
    }

    public async getTokenPriceFrom24hAgo(): Promise<PrismaTokenCurrentPrice[]> {
        const oneDayAgo = moment().subtract(24, 'hours').unix();
        const tokenPrices = await prisma.prismaTokenPrice.findMany({
            orderBy: { timestamp: 'desc' },
            distinct: ['tokenAddress'],
            where: { timestamp: { lte: oneDayAgo } },
        });

        const wethPrice = tokenPrices.find((tokenPrice) => tokenPrice.tokenAddress === networkConfig.weth.address);

        if (wethPrice) {
            tokenPrices.push({
                ...wethPrice,
                tokenAddress: networkConfig.eth.address,
            });
        }

        return tokenPrices
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

    public async updateTokenPrices(): Promise<void> {
        const tokens = await prisma.prismaToken.findMany({
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
            where: { tokenAddress, timestamp: { gt: startTimestamp } },
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
                    price: tokenOutItem.close / tokenInItem.close,
                });
            }
        }

        return items;
    }

    private getStartTimestampFromRange(range: GqlTokenChartDataRange) {
        return moment()
            .subtract(range === 'SEVEN_DAY' ? 7 : 30, 'days')
            .unix();
    }

    private async updateCandleStickData() {
        const timestamp = timestampRoundedUpToNearestHour();
        const tokenPrices = await prisma.prismaTokenPrice.findMany({ where: { timestamp } });
        let operations: any[] = [];

        for (const tokenPrice of tokenPrices) {
            operations.push(
                prisma.prismaTokenPrice.update({
                    where: { tokenAddress_timestamp: { tokenAddress: tokenPrice.tokenAddress, timestamp } },
                    data: {
                        high: Math.max(tokenPrice.high, tokenPrice.price),
                        low: Math.min(tokenPrice.low, tokenPrice.price),
                    },
                }),
            );
        }

        await prisma.$transaction(operations);
    }
}
