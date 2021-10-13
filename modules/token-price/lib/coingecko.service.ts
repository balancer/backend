import axios from 'axios';
import { retryPromiseWithDelay } from '../../util/promise';
import { twentyFourHoursInSecs } from '../../util/time';
import { fromPairs, invert } from 'lodash';
import { env } from '../../../app/env';
import { coinGeckoTokenMappings } from './coingecko-token-mappings';
import { HistoricalPriceResponse, HistoricalPrices, Price, PriceResponse, TokenPrices } from '../token-price-types';
import { cache } from '../../cache/cache';

const CACHE_PREFIX = 'coingecko';

export class CoingeckoService {
    baseUrl: string;
    fiatParam: string;
    appNetwork: string;
    platformId: string;
    nativeAssetId: string;
    nativeAssetAddress: string;

    constructor() {
        this.baseUrl = 'https://api.coingecko.com/api/v3';
        this.fiatParam = 'usd';
        this.appNetwork = env.CHAIN_ID;
        this.platformId = env.COINGECKO_PLATFORM_ID;
        this.nativeAssetId = env.COINGECKO_NATIVE_ASSET_ID;
        this.nativeAssetAddress = env.NATIVE_ASSET_ADDRESS;
    }

    async getNativeAssetPrice(): Promise<Price> {
        try {
            const response = await this.get<PriceResponse>(
                `/simple/price?ids=${this.nativeAssetId}&vs_currencies=${this.fiatParam}`,
            );
            return response[this.nativeAssetId];
        } catch (error) {
            console.error('Unable to fetch Ether price', error);
            throw error;
        }
    }

    /**
     *  Rate limit for the CoinGecko API is 10 calls each second per IP address.
     */
    public async getTokenPrices(addresses: string[], addressesPerRequest = 100): Promise<TokenPrices> {
        const startingAddresses = addresses;
        try {
            const cachedValue = await cache.getValueKeyedOnObject(`${CACHE_PREFIX}getTokenPrices`, {
                addresses: startingAddresses,
            });

            if (cachedValue) {
                return JSON.parse(cachedValue);
            }

            if (addresses.length / addressesPerRequest > 10) throw new Error('To many requests for rate limit.');

            addresses = addresses.map((address) => this.addressMapIn(address));
            const addressesWithCustomPlatform = addresses
                .filter((address) => coinGeckoTokenMappings.Prices.CustomPlatformId[address.toLowerCase()])
                .map((address) => address.toLowerCase());

            addresses = addresses.filter((address) => !addressesWithCustomPlatform.includes(address.toLowerCase()));

            const pageCount = Math.ceil(addresses.length / addressesPerRequest);
            const pages = Array.from(Array(pageCount).keys());
            const requests: Promise<PriceResponse>[] = [];

            pages.forEach((page) => {
                const addressString = addresses.slice(addressesPerRequest * page, addressesPerRequest * (page + 1));
                const endpoint = `/simple/token_price/${this.platformId}?contract_addresses=${addressString}&vs_currencies=${this.fiatParam}`;
                const request = retryPromiseWithDelay(this.get<PriceResponse>(endpoint), 3, 2000);
                requests.push(request);
            });

            addressesWithCustomPlatform.forEach((address) => {
                const endpoint = `/simple/token_price/${this.getPlatformIdForAddress(
                    address,
                )}?contract_addresses=${address}&vs_currencies=${this.fiatParam}`;
                const request = retryPromiseWithDelay(this.get<PriceResponse>(endpoint), 3, 2000);
                requests.push(request);
            });

            const paginatedResults = await Promise.all(requests);
            const results = this.parsePaginatedTokens(paginatedResults);

            // Inject native asset price if included in requested addresses
            if (addresses.includes(this.nativeAssetAddress)) {
                results[this.nativeAssetAddress] = await this.getNativeAssetPrice();
            }

            await cache.putValueKeyedOnObject(
                `${CACHE_PREFIX}getTokenPrices`,
                { addresses: startingAddresses },
                JSON.stringify(results),
                2,
            );

            return results;
        } catch (error) {
            console.error('Unable to fetch token prices', addresses, error);
            throw error;
        }
    }

    async getTokenHistoricalPrices(
        addresses: string[],
        days: number,
        addressesPerRequest = 1,
    ): Promise<HistoricalPrices> {
        if (addresses.length / addressesPerRequest > 10) throw new Error('To many requests for rate limit.');

        const now = Math.floor(Date.now() / 1000);
        const end = now - (now % twentyFourHoursInSecs);
        const start = end - days * twentyFourHoursInSecs;

        addresses = addresses.map((address) => this.addressMapIn(address));
        const requests: Promise<HistoricalPriceResponse>[] = [];

        addresses.forEach((address) => {
            const endpoint = `/coins/${this.getPlatformIdForAddress(
                address.toLowerCase(),
            )}/contract/${address.toLowerCase()}/market_chart/range?vs_currency=${
                this.fiatParam
            }&from=${start}&to=${end}`;
            const request = retryPromiseWithDelay(
                this.get<HistoricalPriceResponse>(endpoint),
                3, // retryCount
                2000, // delayTime
            );
            requests.push(request);
        });

        const paginatedResults = await Promise.all(requests);
        const results = this.parseHistoricalPrices(paginatedResults, addresses, start);

        return results;
    }

    private parsePaginatedTokens(paginatedResults: TokenPrices[]): TokenPrices {
        const results = paginatedResults.reduce((result, page) => ({ ...result, ...page }), {});
        const entries = Object.entries(results)
            .filter((result) => Object.keys(result[1]).length > 0)
            .map((result) => [this.addressMapOut(result[0]), result[1]]);

        return fromPairs(entries);
    }

    private parseHistoricalPrices(
        results: HistoricalPriceResponse[],
        addresses: string[],
        start: number,
    ): HistoricalPrices {
        const assetPrices = fromPairs(
            addresses.map((address, index) => {
                address = this.addressMapOut(address);
                const result = results[index].prices;
                const prices: { [timestamp: number]: number } = {};
                let dayTimestamp = start;
                for (const key in result) {
                    const value = result[key];
                    const [timestamp, price] = value;
                    if (timestamp > dayTimestamp * 1000) {
                        prices[dayTimestamp * 1000] = price;
                        dayTimestamp += twentyFourHoursInSecs;
                    }
                }
                return [address, prices];
            }),
        );

        const prices: { [timestamp: string]: number[] } = {};
        for (const asset in assetPrices) {
            const assetPrice = assetPrices[asset];
            for (const timestamp in assetPrice) {
                const price = assetPrice[timestamp];
                if (!(timestamp in prices)) {
                    prices[timestamp] = [];
                }
                prices[timestamp].push(price);
            }
        }

        return prices;
    }

    /**
     * Map address to mainnet address if app network is a testnet
     */
    public addressMapIn(address: string): string {
        const addressMap = coinGeckoTokenMappings.Prices.ChainMap[this.appNetwork];
        if (!addressMap) return address;
        return addressMap[address.toLowerCase()] || address;
    }

    /**
     * Map mainnet address back to testnet address
     */
    public addressMapOut(address: string): string {
        const addressMap = coinGeckoTokenMappings.Prices.ChainMap[this.appNetwork];
        if (!addressMap) return address;
        return invert(addressMap)[address.toLowerCase()] || address;
    }

    /**
     * Support instances where a token address is not supported by the platform id, provide the option to use a different platform
     * @param address
     */
    public getPlatformIdForAddress(address: string): string {
        return coinGeckoTokenMappings.Prices.CustomPlatformId[address] || this.platformId;
    }

    private async get<T>(endpoint: string): Promise<T> {
        const { data } = await axios.get(this.baseUrl + endpoint);
        return data;
    }
}

export const coingeckoService = new CoingeckoService();
