import axios from 'axios';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { sleep } from '../../common/promise';
import moment from 'moment-timezone';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { timestampRoundedUpToNearestHour } from '../../common/time';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const FIAT_PARAM = 'usd';
const ADDRESSES_PER_REQUEST = 100;

export class CoingeckoDataService {
    constructor() {}

    public async syncTokenDynamicDataFromCoingecko() {
        const tokensWithIds = await prisma.prismaToken.findMany({
            where: { coingeckoTokenId: { not: null } },
            orderBy: { dynamicData: { updatedAt: 'asc' } },
        });

        const chunks = _.chunk(tokensWithIds, 100);

        for (const chunk of chunks) {
            const response = await this.getMarketDataForTokenIds(chunk.map((item) => item.coingeckoTokenId || ''));
            let operations: any[] = [];

            for (const item of response) {
                const token = tokensWithIds.find((token) => token.coingeckoTokenId === item.id);

                if (!token) {
                    continue;
                }

                //const tokenData = await this.getCoinDataForTokenId()

                const data = {
                    price: item.current_price,
                    ath: item.ath,
                    atl: item.atl,
                    marketCap: item.market_cap,
                    fdv: item.fully_diluted_valuation,
                    high24h: item.high_24h,
                    low24h: item.low_24h,
                    priceChange24h: item.price_change_24h,
                    priceChangePercent24h: item.price_change_percentage_24h,
                    priceChangePercent7d: item.price_change_percentage_7d_in_currency,
                    priceChangePercent14d: item.price_change_percentage_14d_in_currency,
                    priceChangePercent30d: item.price_change_percentage_30d_in_currency,
                    updatedAt: item.last_updated,
                };

                operations.push(
                    prisma.prismaTokenDynamicData.upsert({
                        where: { tokenAddress: token.address },
                        update: data,
                        create: {
                            coingeckoId: item.id,
                            tokenAddress: token.address,
                            ...data,
                        },
                    }),
                );
            }

            await prisma.$transaction(operations);
            await sleep(200);
        }
    }

    public async initChartData(tokenAddress: string) {
        const latestTimestamp = timestampRoundedUpToNearestHour();
        tokenAddress = tokenAddress.toLowerCase();

        const operations: any[] = [];
        const token = await prisma.prismaToken.findUnique({ where: { address: tokenAddress } });

        if (!token || !token.coingeckoTokenId) {
            throw new Error('Missing token or token is missing coingecko token id');
        }

        const monthData = await this.getCoinCandlestickData(token.coingeckoTokenId, 30);
        const twentyFourHourData = await this.getCoinCandlestickData(token.coingeckoTokenId, 1);

        //merge 30 min data into hourly data
        const hourlyData = Object.values(
            _.groupBy(twentyFourHourData, (item) => timestampRoundedUpToNearestHour(moment.unix(item[0] / 1000))),
        ).map((hourData) => {
            if (hourData.length === 1) {
                const item = hourData[0];
                item[0] = timestampRoundedUpToNearestHour(moment.unix(item[0] / 1000)) * 1000;

                return item;
            }

            const thirty = hourData[0];
            const hour = hourData[1];

            return [hour[0], thirty[1], Math.max(thirty[2], hour[2]), Math.min(thirty[3], hour[3]), hour[4]];
        });

        operations.push(prisma.prismaTokenPrice.deleteMany({ where: { tokenAddress } }));

        operations.push(
            prisma.prismaTokenPrice.createMany({
                data: monthData
                    .filter((item) => item[0] / 1000 <= latestTimestamp)
                    .map((item) => ({
                        tokenAddress,
                        timestamp: item[0] / 1000,
                        open: item[1],
                        high: item[2],
                        low: item[3],
                        close: item[4],
                        price: item[4],
                        coingecko: true,
                    })),
            }),
        );

        operations.push(
            prisma.prismaTokenPrice.createMany({
                data: hourlyData.map((item) => ({
                    tokenAddress,
                    timestamp: Math.floor(item[0] / 1000),
                    open: item[1],
                    high: item[2],
                    low: item[3],
                    close: item[4],
                    price: item[4],
                    coingecko: true,
                })),
                skipDuplicates: true,
            }),
        );

        await prismaBulkExecuteOperations(operations);
    }

    private async getMarketDataForTokenIds(tokenIds: string[]): Promise<CoingeckoTokenMarketData[]> {
        const endpoint = `/coins/markets?vs_currency=${FIAT_PARAM}&ids=${tokenIds}&per_page=${ADDRESSES_PER_REQUEST}&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C14d%2C30d`;

        return this.get<CoingeckoTokenMarketData[]>(endpoint);
    }

    private async getCoinCandlestickData(
        tokenId: string,
        days: 1 | 30,
    ): Promise<[number, number, number, number, number][]> {
        const endpoint = `/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;

        return this.get(endpoint);
    }

    private async get<T>(endpoint: string): Promise<T> {
        const { data } = await axios.get(BASE_URL + endpoint);
        return data;
    }
}

interface CoingeckoTokenMarketData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number | null;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    ath: number;
    ath_change_percentage: number;
    ath_date: Date;
    atl: number;
    atl_change_percentage: number;
    atl_date: Date;
    roi: null;
    last_updated: Date;
    price_change_percentage_14d_in_currency: number;
    price_change_percentage_1h_in_currency: number;
    price_change_percentage_24h_in_currency: number;
    price_change_percentage_30d_in_currency: number;
    price_change_percentage_7d_in_currency: number;
}
