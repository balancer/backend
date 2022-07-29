import { env } from '../../app/env';
import { TokenDefinition, TokenPriceItem } from './token-types';
import { prisma } from '../../prisma/prisma-client';
import { TokenDataLoaderService } from './lib/token-data-loader.service';
import { TokenPriceService } from './lib/token-price.service';
import { CoingeckoPriceHandlerService } from './lib/token-price-handlers/coingecko-price-handler.service';
import { isFantomNetwork, networkConfig } from '../config/network-config';
import { BptPriceHandlerService } from './lib/token-price-handlers/bpt-price-handler.service';
import { LinearWrappedTokenPriceHandlerService } from './lib/token-price-handlers/linear-wrapped-token-price-handler.service';
import { SwapsPriceHandlerService } from './lib/token-price-handlers/swaps-price-handler.service';
import {
    PrismaToken,
    PrismaTokenCurrentPrice,
    PrismaTokenData,
    PrismaTokenDynamicData,
    PrismaTokenPrice,
} from '@prisma/client';
import { CoingeckoDataService } from './lib/coingecko-data.service';
import { Cache, CacheClass } from 'memory-cache';
import { GqlTokenChartDataRange } from '../../schema';
import { FbeetsPriceHandlerService } from './lib/token-price-handlers/fbeets-price-handler.service';

const TOKEN_PRICES_CACHE_KEY = 'token:prices:current';
const TOKEN_PRICES_24H_AGO_CACHE_KEY = 'token:prices:24h-ago';
const ALL_TOKENS_CACHE_KEY = 'tokens:all';

export class TokenService {
    cache: CacheClass<string, any>;
    constructor(
        private readonly tokenDataLoaderService: TokenDataLoaderService,
        private readonly tokenPriceService: TokenPriceService,
        private readonly coingeckoDataService: CoingeckoDataService,
    ) {
        this.cache = new Cache<string, any>();
    }

    public async syncSanityData() {
        await this.tokenDataLoaderService.syncSanityTokenData();
    }

    public async getTokens(): Promise<PrismaToken[]> {
        let tokens: PrismaToken[] | null = this.cache.get(ALL_TOKENS_CACHE_KEY);
        if (!tokens) {
            tokens = await prisma.prismaToken.findMany({});
            this.cache.put(ALL_TOKENS_CACHE_KEY, tokens, 5 * 60 * 1000);
        }
        return tokens;
    }

    public async getTokenDefinitions(): Promise<TokenDefinition[]> {
        const tokens = await prisma.prismaToken.findMany({
            where: { types: { some: { type: 'WHITE_LISTED' } } },
            include: { types: true },
            orderBy: { priority: 'desc' },
        });

        return tokens.map((token) => ({
            ...token,
            chainId: parseInt(env.CHAIN_ID),
            //TODO: some linear wrapped tokens are tradable. ie: xBOO
            tradable: !token.types.find(
                (type) => type.type === 'PHANTOM_BPT' || type.type === 'BPT' || type.type === 'LINEAR_WRAPPED_TOKEN',
            ),
        }));
    }

    public async loadTokenPrices(): Promise<void> {
        return this.tokenPriceService.updateTokenPrices();
    }

    public async getTokenPrices(): Promise<PrismaTokenCurrentPrice[]> {
        let tokenPrices = this.cache.get(TOKEN_PRICES_CACHE_KEY);
        if (!tokenPrices) {
            tokenPrices = await this.tokenPriceService.getCurrentTokenPrices();
            this.cache.put(TOKEN_PRICES_CACHE_KEY, tokenPrices, 30 * 1000);
        }
        return tokenPrices;
    }

    public async getWhiteListedTokenPrices(): Promise<PrismaTokenCurrentPrice[]> {
        /*const cached = this.cache.get(WHITE_LISTED_TOKEN_PRICES_CACHE_KEY) as PrismaTokenCurrentPrice[] | null;

        if (cached) {
            return cached;
        }

        const tokenPrices = await this.tokenPriceService.getWhiteListedCurrentTokenPrices();
        this.cache.put(WHITE_LISTED_TOKEN_PRICES_CACHE_KEY, tokenPrices, 10000);

        return tokenPrices;*/

        return this.tokenPriceService.getWhiteListedCurrentTokenPrices();
    }

    public getPriceForToken(tokenPrices: PrismaTokenCurrentPrice[], tokenAddress: string): number {
        return this.tokenPriceService.getPriceForToken(tokenPrices, tokenAddress);
    }

    public async syncTokenDynamicData(): Promise<void> {
        await this.coingeckoDataService.syncTokenDynamicDataFromCoingecko();
    }

    public async getTokenDynamicData(tokenAddress: string): Promise<PrismaTokenDynamicData | null> {
        return prisma.prismaTokenDynamicData.findUnique({ where: { tokenAddress: tokenAddress.toLowerCase() } });
    }

    public async getTokensDynamicData(tokenAddresses: string[]): Promise<PrismaTokenDynamicData[]> {
        return prisma.prismaTokenDynamicData.findMany({
            where: { tokenAddress: { in: tokenAddresses.map((address) => address.toLowerCase()) } },
        });
    }

    public async getDataForRange(tokenAddress: string, range: GqlTokenChartDataRange): Promise<PrismaTokenPrice[]> {
        return this.tokenPriceService.getDataForRange(tokenAddress, range);
    }

    public async getRelativeDataForRange(
        tokenIn: string,
        tokenOut: string,
        range: GqlTokenChartDataRange,
    ): Promise<TokenPriceItem[]> {
        return this.tokenPriceService.getRelativeDataForRange(tokenIn, tokenOut, range);
    }

    public async initChartData(tokenAddress: string) {
        await this.coingeckoDataService.initChartData(tokenAddress);
    }

    public async getTokenData(tokenAddress: string): Promise<PrismaTokenData | null> {
        return prisma.prismaTokenData.findUnique({ where: { tokenAddress } });
    }

    public async getTokensData(tokenAddresses: string[]): Promise<PrismaTokenData[]> {
        return prisma.prismaTokenData.findMany({ where: { tokenAddress: { in: tokenAddresses } } });
    }

    public async getTokenPriceFrom24hAgo(): Promise<PrismaTokenCurrentPrice[]> {
        let tokenPrices24hAgo = this.cache.get(TOKEN_PRICES_24H_AGO_CACHE_KEY);
        if (!tokenPrices24hAgo) {
            tokenPrices24hAgo = await this.tokenPriceService.getTokenPriceFrom24hAgo();
            this.cache.put(TOKEN_PRICES_24H_AGO_CACHE_KEY, tokenPrices24hAgo, 60 * 5 * 1000);
        }
        return tokenPrices24hAgo;
    }

    public async getHistoricalTokenPrices() {
        return this.tokenPriceService.getHistoricalTokenPrices();
    }
}

export const tokenService = new TokenService(
    new TokenDataLoaderService(),
    new TokenPriceService([
        ...(isFantomNetwork() ? [new FbeetsPriceHandlerService()] : []),
        new CoingeckoPriceHandlerService(
            networkConfig.coingecko.nativeAssetId,
            networkConfig.coingecko.platformId,
            networkConfig.weth.address,
        ),
        new BptPriceHandlerService(),
        new LinearWrappedTokenPriceHandlerService(),
        new SwapsPriceHandlerService(),
    ]),
    new CoingeckoDataService(),
);
