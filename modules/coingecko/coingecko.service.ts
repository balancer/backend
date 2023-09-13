import axios, { AxiosError } from 'axios';
import { twentyFourHoursInSecs } from '../common/time';
import _ from 'lodash';
import moment from 'moment-timezone';
import { tokenService } from '../token/token.service';
import { TokenDefinition } from '../token/token-types';
import { isAddress } from 'ethers/lib/utils';
import { RateLimiter } from 'limiter';
import { networkContext } from '../network/network-context.service';
import {
    CoingeckoPriceResponse,
    HistoricalPrice,
    HistoricalPriceResponse,
    Price,
    TokenPrices,
} from './coingecko-types';
import { env } from '../../app/env';
import { DeploymentEnv } from '../network/network-config-types';

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
const tokensPerInterval = env.COINGECKO_API_KEY ? ((env.DEPLOYMENT_ENV as DeploymentEnv) === 'main' ? 10 : 5) : 3;
const requestRateLimiter = new RateLimiter({ tokensPerInterval, interval: 'minute' });

export class CoingeckoService {
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

    public async getNativeAssetPrice(): Promise<Price> {
        try {
            const response = await this.get<CoingeckoPriceResponse>(
                `/simple/price?ids=${networkContext.data.coingecko.nativeAssetId}&vs_currencies=${this.fiatParam}`,
            );
            return response[networkContext.data.coingecko.nativeAssetId];
        } catch (error) {
            //console.error('Unable to fetch Ether price', error);
            throw error;
        }
    }

    /**
     *  Rate limit for the CoinGecko API is 10 calls each second per IP address.
     */
    public async getTokenPrices(addresses: string[]): Promise<TokenPrices> {
        //max 180 addresses per request because of URI size limit
        const addressesPerRequest = 180;
        try {
            if (addresses.length / addressesPerRequest > 10) throw new Error('Too many requests for rate limit.');

            const tokenDefinitions = await tokenService.getTokenDefinitions();
            const mapped = addresses.map((address) => this.getMappedTokenDetails(address, tokenDefinitions));
            const groupedByPlatform = _.groupBy(mapped, 'platform');

            const requests: Promise<CoingeckoPriceResponse>[] = [];

            _.forEach(groupedByPlatform, (tokens, platform) => {
                const mappedAddresses = tokens.map((token) => token.address);
                const pageCount = Math.ceil(mappedAddresses.length / addressesPerRequest);
                const pages = Array.from(Array(pageCount).keys());

                pages.forEach((page) => {
                    const addressString = mappedAddresses.slice(
                        addressesPerRequest * page,
                        addressesPerRequest * (page + 1),
                    );
                    const endpoint = `/simple/token_price/${platform}?contract_addresses=${addressString}&vs_currencies=${this.fiatParam}`;
                    const request = this.get<CoingeckoPriceResponse>(endpoint);
                    requests.push(request);
                });
            });

            const paginatedResults = await Promise.all(requests);
            const results = this.parsePaginatedTokens(paginatedResults, mapped);

            return results;
        } catch (error: any) {
            throw new Error(`Unable to fetch token prices - ${error.message} - ${error.statusCode}`);
        }
    }

    public async getTokenHistoricalPrices(address: string, days: number): Promise<HistoricalPrice[]> {
        const now = Math.floor(Date.now() / 1000);
        const end = now;
        const start = end - days * twentyFourHoursInSecs;
        const tokenDefinitions = await tokenService.getTokenDefinitions();
        const mapped = this.getMappedTokenDetails(address, tokenDefinitions);

        const endpoint = `/coins/${mapped.platform}/contract/${mapped.address}/market_chart/range?vs_currency=${this.fiatParam}&from=${start}&to=${end}`;

        const result = await this.get<HistoricalPriceResponse>(endpoint);

        return result.prices.map((item) => ({
            //anchor to the start of the hour
            timestamp:
                moment
                    .unix(item[0] / 1000)
                    .startOf('hour')
                    .unix() * 1000,
            price: item[1],
        }));
    }

    private parsePaginatedTokens(paginatedResults: TokenPrices[], mappedTokens: MappedToken[]): TokenPrices {
        const results = paginatedResults.reduce((result, page) => ({ ...result, ...page }), {});
        const prices: TokenPrices = _.mapKeys(results, (val, address) => address);

        const resultAddresses = Object.keys(results);
        for (const mappedToken of mappedTokens) {
            if (mappedToken.originalAddress) {
                const resultAddress = resultAddresses.find(
                    (address) => address.toLowerCase() === mappedToken.address.toLowerCase(),
                );
                if (!resultAddress) {
                    console.warn(`Matching address for original address ${mappedToken.originalAddress} not found`);
                } else {
                    prices[mappedToken.originalAddress] = results[resultAddress];
                }
            }
        }

        return prices;
    }

    /**
     * Support instances where a token address is not supported by the platform id, provide the option to use a different platform
     */
    public getMappedTokenDetails(address: string, tokens: TokenDefinition[]): MappedToken {
        const token = tokens.find((token) => token.address.toLowerCase() === address.toLowerCase());
        if (token && token.coingeckoPlatformId && token.coingeckoContractAddress) {
            return {
                platform: token.coingeckoPlatformId,
                address: isAddress(token.coingeckoContractAddress)
                    ? token.coingeckoContractAddress.toLowerCase()
                    : token.coingeckoContractAddress,
                originalAddress: address.toLowerCase(),
            };
        }

        return {
            platform: networkContext.data.coingecko.platformId,
            address: address.toLowerCase(),
        };
    }

    public async getMarketDataForTokenIds(tokenIds: string[]): Promise<CoingeckoTokenMarketData[]> {
        const endpoint = `/coins/markets?vs_currency=${this.fiatParam}&ids=${tokenIds}&per_page=250&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d%2C14d%2C30d`;

        return this.get<CoingeckoTokenMarketData[]>(endpoint);
    }

    public async getCoinCandlestickData(
        tokenId: string,
        days: 1 | 30,
    ): Promise<[number, number, number, number, number][]> {
        const endpoint = `/coins/${tokenId}/ohlc?vs_currency=usd&days=${days}`;

        return this.get(endpoint);
    }

    public async getCoinIdList(): Promise<CoinId[]> {
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

export const coingeckoService = new CoingeckoService();
