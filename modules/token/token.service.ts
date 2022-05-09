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
import { PrismaTokenPrice } from '@prisma/client';

export class TokenService {
    constructor(
        private readonly tokenDataLoaderService: TokenDataLoaderService,
        private readonly tokenPriceService: TokenPriceService,
    ) {}

    public async syncTokensFromPoolTokens() {
        await this.tokenDataLoaderService.syncTokensFromPoolTokens();
    }

    public async syncSanityData() {
        await this.tokenDataLoaderService.syncSanityTokenData();
    }

    public async getTokenDefinitions(): Promise<TokenDefinition[]> {
        const tokens = await prisma.prismaToken.findMany({});

        return tokens.map((token) => ({
            ...token,
            chainId: parseInt(env.CHAIN_ID),
        }));
    }

    public async loadTokenPrices(): Promise<void> {
        return this.tokenPriceService.updateTokenPrices();
    }

    public async getCurrentTokenPrices(): Promise<PrismaTokenPrice[]> {
        return this.tokenPriceService.getCurrentTokenPrices();
    }
}

export const tokenService = new TokenService(
    new TokenDataLoaderService(),
    new TokenPriceService([
        new CoingeckoPriceHandlerService(
            networkConfig.coingecko.nativeAssetId,
            networkConfig.coingecko.platformId,
            networkConfig.wethAddress,
        ),
        new BptPriceHandlerService(),
        new LinearWrappedTokenPriceHandlerService(),
        new SwapsPriceHandlerService(),
    ]),
);
