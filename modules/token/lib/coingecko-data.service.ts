import { prisma } from '../../../prisma/prisma-client';
import _, { update } from 'lodash';
import moment from 'moment-timezone';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { timestampEndOfDayMidnight, timestampRoundedUpToNearestHour, twentyFourHoursInSecs } from '../../common/time';
import { networkContext } from '../../network/network-context.service';
import { AllNetworkConfigs } from '../../network/network-config';
import { PrismaToken } from '.prisma/client';
import { env } from '../../../app/env';
import { isAddress } from 'viem';
import { RateLimiter } from 'limiter';
import { tokenService } from '../token.service';
import { TokenDefinition } from '../token-types';
import axios, { AxiosError } from 'axios';
import { PrismaTokenWithTypes } from '../../../prisma/prisma-types';

type Price = { usd: number };
type CoingeckoPriceResponse = { [id: string]: Price };
type TokenPrices = { [address: string]: Price };

interface HistoricalPriceResponse {
    market_caps: number[][];
    prices: number[][];
    total_volumes: number[][];
}

type HistoricalPrice = { timestamp: number; price: number };
export type TokenHistoricalPrices = { [address: string]: HistoricalPrice[] };

interface MappedToken {
    platform: string;
    address: string;
    originalAddress?: string;
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

interface CoinId {
    id: string;
    symbol: string;
    name: string;
    platforms: Record<string, string>;
}

/* coingecko has a rate limit of 10-50req/minute
   https://www.coingecko.com/en/api/pricing:
   Our free API has a rate limit of 10-50 calls per minute,
   if you exceed that limit you will be blocked until the next 1 minute window.
   Do revise your queries to ensure that you do not exceed our limits should
   that happen.

*/
const tokensPerMinute = env.COINGECKO_API_KEY ? 10 : 3;
const requestRateLimiter = new RateLimiter({ tokensPerInterval: tokensPerMinute, interval: 'minute' });
//max 10 addresses per request because of URI size limit, pro is max 180 because of URI limit
const addressChunkSize = env.COINGECKO_API_KEY ? 180 : 20;
export class CoingeckoDataService {
    private readonly baseUrl: string;
    private readonly fiatParam: string;
    private readonly apiKeyParam: string;

    constructor() {
        this.baseUrl = env.COINGECKO_API_KEY
            ? 'https://pro-api.coingecko.com/api/v3'
            : 'https://api.coingecko.com/api/v3';
        this.fiatParam = 'usd';
        this.apiKeyParam = env.COINGECKO_API_KEY ? `&x_cg_pro_api_key=${env.COINGECKO_API_KEY}` : '';
    }

    public async updatePricesForTokensWithCoingeckoIds(tokensWithCoingeckoIds: PrismaTokenWithTypes[]) {
        const timestamp = timestampRoundedUpToNearestHour();
        const timestampMidnight = timestampEndOfDayMidnight();
        const updated: PrismaTokenWithTypes[] = [];

        const uniqueTokensWithIds = _.uniqBy(tokensWithCoingeckoIds, 'coingeckoTokenId');

        const chunks = _.chunk(uniqueTokensWithIds, 250); //max page size is 250

        for (const chunk of chunks) {
            const response = await this.getMarketDataForTokenIds(chunk.map((item) => item.coingeckoTokenId || ''));
            let operations: any[] = [];

            for (const item of response) {
                const tokensToUpdate = tokensWithCoingeckoIds.filter((token) => token.coingeckoTokenId === item.id);
                for (const tokenToUpdate of tokensToUpdate) {
                    // only update if we have a new price and if we have a price at all
                    if (moment(item.last_updated).isAfter(moment().subtract(10, 'minutes')) && item.current_price) {
                        const data = {
                            price: item.current_price,
                            ath: item.ath ?? undefined,
                            atl: item.atl ?? undefined,
                            marketCap: item.market_cap ?? undefined,
                            fdv: item.fully_diluted_valuation ?? undefined,
                            high24h: item.high_24h ?? undefined,
                            low24h: item.low_24h ?? undefined,
                            priceChange24h: item.price_change_24h ?? undefined,
                            priceChangePercent24h: item.price_change_percentage_24h ?? undefined,
                            priceChangePercent7d: item.price_change_percentage_7d_in_currency ?? undefined,
                            priceChangePercent14d: item.price_change_percentage_14d_in_currency ?? undefined,
                            priceChangePercent30d: item.price_change_percentage_30d_in_currency ?? undefined,
                            updatedAt: item.last_updated,
                        };

                        operations.push(
                            prisma.prismaTokenDynamicData.upsert({
                                where: {
                                    tokenAddress_chain: {
                                        tokenAddress: tokenToUpdate.address,
                                        chain: tokenToUpdate.chain,
                                    },
                                },
                                update: data,
                                create: {
                                    coingeckoId: item.id,
                                    tokenAddress: tokenToUpdate.address,
                                    chain: tokenToUpdate.chain,
                                    ...data,
                                },
                            }),
                        );

                        // upsert hourly price and price data, for every chain
                        operations.push(
                            prisma.prismaTokenPrice.upsert({
                                where: {
                                    tokenAddress_timestamp_chain: {
                                        tokenAddress: tokenToUpdate.address,
                                        timestamp,
                                        chain: tokenToUpdate.chain,
                                    },
                                },
                                update: { price: item.current_price, close: item.current_price },
                                create: {
                                    tokenAddress: tokenToUpdate.address,
                                    chain: tokenToUpdate.chain,
                                    timestamp,
                                    price: item.current_price,
                                    high: item.current_price,
                                    low: item.current_price,
                                    open: item.current_price,
                                    close: item.current_price,
                                    coingecko: true,
                                },
                            }),
                        );

                        // upsert daily price and price data, for every chain
                        operations.push(
                            prisma.prismaTokenPrice.upsert({
                                where: {
                                    tokenAddress_timestamp_chain: {
                                        tokenAddress: tokenToUpdate.address,
                                        timestamp: timestampMidnight,
                                        chain: tokenToUpdate.chain,
                                    },
                                },
                                update: { price: item.current_price, close: item.current_price },
                                create: {
                                    tokenAddress: tokenToUpdate.address,
                                    chain: tokenToUpdate.chain,
                                    timestamp: timestampMidnight,
                                    price: item.current_price,
                                    high: item.current_price,
                                    low: item.current_price,
                                    open: item.current_price,
                                    close: item.current_price,
                                    coingecko: true,
                                },
                            }),
                        );

                        // upsert current price and price data, for every chain
                        operations.push(
                            prisma.prismaTokenCurrentPrice.upsert({
                                where: {
                                    tokenAddress_chain: {
                                        tokenAddress: tokenToUpdate.address,
                                        chain: tokenToUpdate.chain,
                                    },
                                },
                                update: { price: item.current_price },
                                create: {
                                    tokenAddress: tokenToUpdate.address,
                                    chain: tokenToUpdate.chain,
                                    timestamp,
                                    price: item.current_price,
                                    coingecko: true,
                                },
                            }),
                        );
                        updated.push(tokenToUpdate);
                    }
                }
            }

            await prismaBulkExecuteOperations(operations);
        }
        return updated;
    }

    public async syncCoingeckoIds() {
        const allTokens = await prisma.prismaToken.findMany({ where: { chain: networkContext.chain } });

        const coinIds = await this.getCoinIdList();

        for (const token of allTokens) {
            const coinId = coinIds.find((coinId) => {
                if (coinId.platforms[networkContext.data.coingecko.platformId]) {
                    return coinId.platforms[networkContext.data.coingecko.platformId].toLowerCase() === token.address;
                }
            });

            if (coinId && token.coingeckoTokenId !== coinId.id) {
                await prisma.prismaToken.update({
                    where: {
                        address_chain: { address: token.address, chain: networkContext.chain },
                    },
                    data: {
                        coingeckoTokenId: coinId.id,
                        coingeckoPlatformId: networkContext.data.coingecko.platformId,
                    },
                });
            }
        }
    }

    // public async initChartData(tokenAddress: string) {
    //     const latestTimestamp = timestampRoundedUpToNearestHour();
    //     tokenAddress = tokenAddress.toLowerCase();

    //     const operations: any[] = [];
    //     const token = await prisma.prismaToken.findUnique({
    //         where: {
    //             address_chain: {
    //                 address: tokenAddress,
    //                 chain: networkContext.chain,
    //             },
    //         },
    //     });

    //     if (!token || !token.coingeckoTokenId) {
    //         throw new Error('Missing token or token is missing coingecko token id');
    //     }

    //     const monthData = await this.getCoinCandlestickData(token.coingeckoTokenId, 30);
    //     const twentyFourHourData = await this.getCoinCandlestickData(token.coingeckoTokenId, 1);

    //     //merge 30 min data into hourly data
    //     const hourlyData = Object.values(
    //         _.groupBy(twentyFourHourData, (item) => timestampRoundedUpToNearestHour(moment.unix(item[0] / 1000))),
    //     ).map((hourData) => {
    //         if (hourData.length === 1) {
    //             const item = hourData[0];
    //             item[0] = timestampRoundedUpToNearestHour(moment.unix(item[0] / 1000)) * 1000;

    //             return item;
    //         }

    //         const thirty = hourData[0];
    //         const hour = hourData[1];

    //         return [hour[0], thirty[1], Math.max(thirty[2], hour[2]), Math.min(thirty[3], hour[3]), hour[4]];
    //     });

    //     operations.push(prisma.prismaTokenPrice.deleteMany({ where: { tokenAddress, chain: networkContext.chain } }));

    //     operations.push(
    //         prisma.prismaTokenPrice.createMany({
    //             data: monthData
    //                 .filter((item) => item[0] / 1000 <= latestTimestamp)
    //                 .map((item) => ({
    //                     tokenAddress,
    //                     chain: networkContext.chain,
    //                     timestamp: item[0] / 1000,
    //                     open: item[1],
    //                     high: item[2],
    //                     low: item[3],
    //                     close: item[4],
    //                     price: item[4],
    //                     coingecko: true,
    //                 })),
    //         }),
    //     );

    //     operations.push(
    //         prisma.prismaTokenPrice.createMany({
    //             data: hourlyData.map((item) => ({
    //                 tokenAddress,
    //                 chain: networkContext.chain,
    //                 timestamp: Math.floor(item[0] / 1000),
    //                 open: item[1],
    //                 high: item[2],
    //                 low: item[3],
    //                 close: item[4],
    //                 price: item[4],
    //                 coingecko: true,
    //             })),
    //             skipDuplicates: true,
    //         }),
    //     );

    //     await prismaBulkExecuteOperations(operations, true);
    // }

    // /**
    //  *  Rate limit for the CoinGecko API is 10 calls each second per IP address.
    //  */
    // public async getTokenPrices(addresses: string[]): Promise<TokenPrices> {
    //     const addressesPerRequest = addressChunkSize;
    //     try {
    //         // if (addresses.length / addressesPerRequest > tokensPerMinute)
    //         //     throw new Error('Too many requests for rate limit.');

    //         const tokenDefinitions = await tokenService.getTokenDefinitions([networkContext.chain]);
    //         const mapped = addresses.map((address) => this.getMappedTokenDetails(address, tokenDefinitions));
    //         const groupedByPlatform = _.groupBy(mapped, 'platform');

    //         const requests: Promise<CoingeckoPriceResponse>[] = [];

    //         _.forEach(groupedByPlatform, (tokens, platform) => {
    //             const mappedAddresses = tokens.map((token) => token.address);
    //             const pageCount = Math.ceil(mappedAddresses.length / addressesPerRequest);
    //             const pages = Array.from(Array(pageCount).keys());

    //             pages.forEach((page) => {
    //                 const addressString = mappedAddresses.slice(
    //                     addressesPerRequest * page,
    //                     addressesPerRequest * (page + 1),
    //                 );
    //                 const endpoint = `/simple/token_price/${platform}?contract_addresses=${addressString}&vs_currencies=${this.fiatParam}`;
    //                 const request = this.get<CoingeckoPriceResponse>(endpoint);
    //                 requests.push(request);
    //             });
    //         });

    //         const paginatedResults = await Promise.all(requests);
    //         const results = this.parsePaginatedTokens(paginatedResults, mapped);

    //         return results;
    //     } catch (error: any) {
    //         throw new Error(`Unable to fetch token prices - ${error.message} - ${error.statusCode}`);
    //     }
    // }

    // public async getTokenHistoricalPrices(address: string, days: number): Promise<HistoricalPrice[]> {
    //     const now = Math.floor(Date.now() / 1000);
    //     const end = now;
    //     const start = end - days * twentyFourHoursInSecs;
    //     const tokenDefinitions = await tokenService.getTokenDefinitions([networkContext.chain]);
    //     const mapped = this.getMappedTokenDetails(address, tokenDefinitions);

    //     const endpoint = `/coins/${mapped.platform}/contract/${mapped.address}/market_chart/range?vs_currency=${this.fiatParam}&from=${start}&to=${end}`;

    //     const result = await this.get<HistoricalPriceResponse>(endpoint);

    //     return result.prices.map((item) => ({
    //         //anchor to the start of the hour
    //         timestamp:
    //             moment
    //                 .unix(item[0] / 1000)
    //                 .startOf('hour')
    //                 .unix() * 1000,
    //         price: item[1],
    //     }));
    // }

    // private parsePaginatedTokens(paginatedResults: TokenPrices[], mappedTokens: MappedToken[]): TokenPrices {
    //     const results = paginatedResults.reduce((result, page) => ({ ...result, ...page }), {});
    //     const prices: TokenPrices = _.mapKeys(results, (val, address) => address);

    //     const resultAddresses = Object.keys(results);
    //     for (const mappedToken of mappedTokens) {
    //         if (mappedToken.originalAddress) {
    //             const resultAddress = resultAddresses.find(
    //                 (address) => address.toLowerCase() === mappedToken.address.toLowerCase(),
    //             );
    //             if (!resultAddress) {
    //                 console.warn(`Matching address for original address ${mappedToken.originalAddress} not found`);
    //             } else {
    //                 prices[mappedToken.originalAddress] = results[resultAddress];
    //             }
    //         }
    //     }

    //     return prices;
    // }

    /**
     * Support instances where a token address is not supported by the platform id, provide the option to use a different platform
    //  */
    // public getMappedTokenDetails(address: string, tokens: TokenDefinition[]): MappedToken {
    //     const token = tokens.find((token) => token.address.toLowerCase() === address.toLowerCase());
    //     if (token && token.coingeckoPlatformId && token.coingeckoContractAddress) {
    //         return {
    //             platform: token.coingeckoPlatformId,
    //             address: isAddress(token.coingeckoContractAddress)
    //                 ? token.coingeckoContractAddress.toLowerCase()
    //                 : token.coingeckoContractAddress,
    //             originalAddress: address.toLowerCase(),
    //         };
    //     }

    //     return {
    //         platform: networkContext.data.coingecko.platformId,
    //         address: address.toLowerCase(),
    //     };
    // }

    private async getMarketDataForTokenIds(tokenIds: string[]): Promise<CoingeckoTokenMarketData[]> {
        const endpoint = `/coins/markets?vs_currency=${this.fiatParam}&ids=${tokenIds}&per_page=250&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C14d%2C30d`;

        return this.get<CoingeckoTokenMarketData[]>(endpoint);
    }

    // public async getCoinCandlestickData(
    //     tokenId: string,
    //     days: 1 | 30,
    // ): Promise<[number, number, number, number, number][]> {
    //     const endpoint = `/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;

    //     return this.get(endpoint);
    // }

    private async getCoinIdList(): Promise<CoinId[]> {
        const endpoint = `/coins/list?include_platform=true`;
        return this.get<CoinId[]>(endpoint);
    }

    private async get<T>(endpoint: string): Promise<T> {
        const remainingRequests = await requestRateLimiter.removeTokens(1);
        console.log('Remaining coingecko requests', remainingRequests);
        let response;
        try {
            response = await axios.get(this.baseUrl + endpoint + this.apiKeyParam);
        } catch (err: any | AxiosError) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 429) {
                    throw Error(`Coingecko ratelimit: ${err}`);
                }
            }
            throw err;
        }
        return response.data;
    }
}

export const coingeckoDataService = new CoingeckoDataService();
