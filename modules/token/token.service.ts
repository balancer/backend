import { env } from '../../app/env';
import { TokenDefinition } from './token-types';
import { prisma } from '../util/prisma-client';
import { TokenDataLoaderService } from './src/token-data-loader.service';
import { TokenPriceService } from './src/token-price.service';
import { CoingeckoPriceHandlerService } from './token-price-handlers/coingecko-price-handler.service';
import { networkConfig } from '../config/network-config';
import { BptPriceHandlerService } from './token-price-handlers/bpt-price-handler.service';
import { LinearWrappedTokenPriceHandlerService } from './token-price-handlers/linear-wrapped-token-price-handler.service';
import { SwapsPriceHandlerService } from './token-price-handlers/swaps-price-handler.service';
import { PrismaTokenDynamicData, PrismaTokenPrice } from '@prisma/client';
import { CoingeckoDataService } from './src/coingecko-data.service';
import { Cache, CacheClass } from 'memory-cache';

const TOKEN_PRICES_CACHE_KEY = 'token:prices:current';
const WHITE_LISTED_TOKEN_PRICES_CACHE_KEY = 'token:prices:whitelist:current';

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

    public async getTokenPrices(): Promise<PrismaTokenPrice[]> {
        const cached = this.cache.get(TOKEN_PRICES_CACHE_KEY) as PrismaTokenPrice[] | null;

        if (cached) {
            return cached;
        }

        const tokenPrices = await this.tokenPriceService.getCurrentTokenPrices();
        this.cache.put(TOKEN_PRICES_CACHE_KEY, tokenPrices, 10000);

        return tokenPrices;
    }

    public async getWhiteListedTokenPrices(): Promise<PrismaTokenPrice[]> {
        const cached = this.cache.get(WHITE_LISTED_TOKEN_PRICES_CACHE_KEY) as PrismaTokenPrice[] | null;

        if (cached) {
            return cached;
        }

        const tokenPrices = await this.tokenPriceService.getCurrentTokenPrices();
        this.cache.put(WHITE_LISTED_TOKEN_PRICES_CACHE_KEY, tokenPrices, 10000);

        return tokenPrices;
    }

    public getPriceForToken(tokenPrices: PrismaTokenPrice[], tokenAddress: string): number {
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
}

export const tokenService = new TokenService(
    new TokenDataLoaderService(),
    new TokenPriceService([
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
