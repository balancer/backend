import axios from 'axios';
import { prisma } from '../../util/prisma-client';
import _ from 'lodash';
import { sleep } from '../../util/promise';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const FIAT_PARAM = 'usd';
const ADDRESSES_PER_REQUEST = 100;

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
                        where: { id: item.id },
                        update: data,
                        create: {
                            id: item.id,
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

    private async getMarketDataForTokenIds(tokenIds: string[]): Promise<CoingeckoTokenMarketData[]> {
        const endpoint = `/coins/markets?vs_currency=${FIAT_PARAM}&ids=${tokenIds}&per_page=${ADDRESSES_PER_REQUEST}&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C14d%2C30d`;

        return this.get<CoingeckoTokenMarketData[]>(endpoint);
    }

    private async get<T>(endpoint: string): Promise<T> {
        const { data } = await axios.get(BASE_URL + endpoint);
        return data;
    }
}
