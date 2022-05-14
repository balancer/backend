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
        return this.tokenPriceService.getCurrentTokenPrices();
    }

    public async getWhiteListedTokenPrices(): Promise<PrismaTokenPrice[]> {
        return this.tokenPriceService.getWhiteListedCurrentTokenPrices();
    }

    public getPriceForToken(tokenPrices: PrismaTokenPrice[], tokenAddress: string): number {
        return this.tokenPriceService.getPriceForToken(tokenPrices, tokenAddress);
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
