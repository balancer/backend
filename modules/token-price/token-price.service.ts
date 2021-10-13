import { TokenHistoricalPrices, TokenPrices } from './token-price-types';
import { coingeckoService } from './lib/coingecko.service';
import { balancerTokenMappings } from './lib/balancer-token-mappings';
import { balancerPriceService } from './lib/balancer-price.service';
import { balancerService } from '../balancer-subgraph/balancer.service';
import { cache } from '../cache/cache';
import { sleep } from '../util/promise';

const TOKEN_PRICES_CACHE_KEY = 'token-prices';
const TOKEN_HISTORICAL_PRICES_CACHE_KEY = 'token-historical-prices';

export class TokenPriceService {
    public async getTokenPrices(): Promise<TokenPrices> {
        const tokenPrices = await cache.getObjectValue<TokenPrices>(TOKEN_PRICES_CACHE_KEY);

        if (tokenPrices) {
            return tokenPrices;
        }

        return this.cacheTokenPrices();
    }

    public async cacheTokenPrices(): Promise<TokenPrices> {
        //TODO: if we get to a point where we support more than 1000 tokens, we need to paginate this better
        const { balancerTokens, coingeckoTokens } = await this.getTokenAddresses();

        const coingeckoTokenPrices = await coingeckoService.getTokenPrices(coingeckoTokens);
        const balancerTokenPrices = await balancerPriceService.getTokenPrices(balancerTokens, coingeckoTokenPrices);
        const tokenPrices = { ...coingeckoTokenPrices, ...balancerTokenPrices };

        await cache.putObjectValue(TOKEN_PRICES_CACHE_KEY, tokenPrices, 30);

        return tokenPrices;
    }

    public async cacheHistoricalTokenPrices(): Promise<void> {
        const { balancerTokens, coingeckoTokens } = await this.getTokenAddresses();
        const tokenPrices: TokenHistoricalPrices = {};

        for (const token in coingeckoTokens) {
            tokenPrices[token] = await coingeckoService.getTokenHistoricalPrices([token], 30);

            //coingecko rate limit is 10 requests per seconds, be generous here so we don't get rate limited
            await sleep(150);
        }

        for (const token in balancerTokens) {
            //
        }
    }

    private async getTokenAddresses(): Promise<{ balancerTokens: string[]; coingeckoTokens: string[] }> {
        const { pools } = await balancerService.getPools({ first: 1000 });

        const addresses = balancerService.getUniqueTokenAddressesFromPools(pools);
        const balancerTokens = Object.keys(balancerTokenMappings.tokenPriceOraclePool);
        const coingeckoTokens = addresses.filter((address) => !balancerTokens.includes(address.toLowerCase()));

        return { balancerTokens, coingeckoTokens };
    }
}

export const tokenPriceService = new TokenPriceService();
