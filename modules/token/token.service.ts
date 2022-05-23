import { cache } from '../cache/cache';
import { env } from '../../app/env';
import { TokenDefinition } from './token-types';
import { sanityClient } from '../sanity/sanity';
import { thirtyDaysInMinutes } from '../util/time';

const TOKEN_DEFINITIONS_CACHE_KEY = 'token-definitions';

const SANITY_TOKEN_TYPE: { [key: string]: string } = {
    '250': 'fantomToken',
    '4': 'rinkebyToken',
    '10': 'optimismToken',
};

export class TokenService {
    public async getTokens(): Promise<TokenDefinition[]> {
        const cached = await cache.getObjectValue<TokenDefinition[]>(TOKEN_DEFINITIONS_CACHE_KEY);

        if (cached) {
            return cached;
        }

        return this.cacheTokens();
    }

    public async cacheTokens(): Promise<TokenDefinition[]> {
        const tokens = await sanityClient.fetch<TokenDefinition[]>(`
            *[_type=="${SANITY_TOKEN_TYPE[env.CHAIN_ID]}"] {
                name,
                address,
                symbol,
                decimals,
                "chainId": ${env.CHAIN_ID},
                logoURI,
                coingeckoPlatformId,
                coingeckoContractAddress
            }
        `);

        await cache.putObjectValue(TOKEN_DEFINITIONS_CACHE_KEY, tokens, thirtyDaysInMinutes);

        return tokens;
    }
}

export const tokenService = new TokenService();
