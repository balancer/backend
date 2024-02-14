import { TokenDefinition, TokenPriceItem } from './token-types';
import { prisma } from '../../prisma/prisma-client';
import { TokenPriceService } from './lib/token-price.service';
import { Chain, PrismaToken, PrismaTokenCurrentPrice, PrismaTokenDynamicData, PrismaTokenPrice } from '@prisma/client';
import { CoingeckoDataService } from './lib/coingecko-data.service';
import { Cache, CacheClass } from 'memory-cache';
import { GqlTokenChartDataRange, MutationTokenDeletePriceArgs, MutationTokenDeleteTokenTypeArgs } from '../../schema';
import { coingeckoService } from '../coingecko/coingecko.service';
import { networkContext } from '../network/network-context.service';
import { Dictionary } from 'lodash';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';

const TOKEN_PRICES_CACHE_KEY = `token:prices:current`;
const TOKEN_PRICES_24H_AGO_CACHE_KEY = `token:prices:24h-ago`;
const ALL_TOKENS_CACHE_KEY = `tokens:all`;

export class TokenService {
    cache: CacheClass<string, any>;
    constructor(
        private readonly tokenPriceService: TokenPriceService,
        private readonly coingeckoDataService: CoingeckoDataService,
    ) {
        this.cache = new Cache<string, any>();
    }

    public async syncTokenContentData() {
        await networkContext.config.contentService.syncTokenContentData();
    }

    public async getToken(address: string, chain = networkContext.chain): Promise<PrismaToken | null> {
        return prisma.prismaToken.findUnique({
            where: {
                address_chain: {
                    address: address.toLowerCase(),
                    chain,
                },
            },
        });
    }

    public async getTokens(addresses?: string[], chain = networkContext.chain): Promise<PrismaToken[]> {
        let tokens: PrismaToken[] | null = this.cache.get(`${ALL_TOKENS_CACHE_KEY}:${chain}`);
        if (!tokens) {
            tokens = await prisma.prismaToken.findMany({ where: { chain: chain } });
            this.cache.put(`${ALL_TOKENS_CACHE_KEY}:${chain}`, tokens, 5 * 60 * 1000);
        }
        if (addresses) {
            return tokens.filter((token) => addresses.includes(token.address));
        }
        return tokens;
    }

    public async getTokenDefinitions(chains: Chain[]): Promise<TokenDefinition[]> {
        const tokens = await prisma.prismaToken.findMany({
            where: { types: { some: { type: 'WHITE_LISTED' } }, chain: { in: chains } },
            include: { types: true },
            orderBy: { priority: 'desc' },
        });

        for (const chain of chains) {
            const weth = tokens.find(
                (token) =>
                    token.chain === chain && token.address === AllNetworkConfigsKeyedOnChain[chain].data.weth.address,
            );

            if (weth) {
                tokens.push({
                    ...weth,
                    name: AllNetworkConfigsKeyedOnChain[chain].data.eth.name,
                    address: AllNetworkConfigsKeyedOnChain[chain].data.eth.address,
                    symbol: AllNetworkConfigsKeyedOnChain[chain].data.eth.symbol,
                    chain: AllNetworkConfigsKeyedOnChain[chain].data.chain.prismaId,
                });
            }
        }

        return tokens.map((token) => ({
            ...token,
            chainId: AllNetworkConfigsKeyedOnChain[token.chain].data.chain.id,
            tradable: !token.types.find((type) => type.type === 'PHANTOM_BPT' || type.type === 'BPT'),
        }));
    }

    public async updateTokenPrices(): Promise<void> {
        return this.tokenPriceService.updateAllTokenPrices();
    }

    public async getTokenPrices(chain = networkContext.chain): Promise<PrismaTokenCurrentPrice[]> {
        let tokenPrices = this.cache.get(`${TOKEN_PRICES_CACHE_KEY}:${chain}`);
        if (!tokenPrices) {
            tokenPrices = await this.tokenPriceService.getCurrentTokenPrices(chain);
            this.cache.put(`${TOKEN_PRICES_CACHE_KEY}:${chain}`, tokenPrices, 30 * 1000);
        }
        return tokenPrices;
    }

    public async getTokenPricesForChains(chains: Chain[]): Promise<Dictionary<PrismaTokenCurrentPrice[]>> {
        const response: Dictionary<PrismaTokenCurrentPrice[]> = {};

        for (const chain of chains) {
            response[chain] = await this.getTokenPrices(chain);
        }

        return response;
    }

    public async getWhiteListedTokenPrices(chains: Chain[]): Promise<PrismaTokenCurrentPrice[]> {
        /*const cached = this.cache.get(WHITE_LISTED_TOKEN_PRICES_CACHE_KEY) as PrismaTokenCurrentPrice[] | null;

        if (cached) {
            return cached;
        }

        const tokenPrices = await this.tokenPriceService.getWhiteListedCurrentTokenPrices();
        this.cache.put(WHITE_LISTED_TOKEN_PRICES_CACHE_KEY, tokenPrices, 10000);

        return tokenPrices;*/

        return this.tokenPriceService.getWhiteListedCurrentTokenPrices(chains);
    }

    public async getProtocolTokenPrice(): Promise<string> {
        const tokenPrices = await tokenService.getTokenPrices();

        if (networkContext.data.protocolToken === 'bal') {
            return tokenService.getPriceForToken(tokenPrices, networkContext.data.bal!.address).toString();
        } else {
            return tokenService.getPriceForToken(tokenPrices, networkContext.data.beets!.address).toString();
        }
    }

    public getPriceForToken(tokenPrices: PrismaTokenCurrentPrice[], tokenAddress: string): number {
        return this.tokenPriceService.getPriceForToken(tokenPrices, tokenAddress);
    }

    public async syncCoingeckoPricesForAllChains(): Promise<void> {
        await this.coingeckoDataService.syncCoingeckoPricesForAllChains();
    }

    public async syncCoingeckoIds(): Promise<void> {
        await this.coingeckoDataService.syncCoingeckoIds();
    }

    public async getTokenDynamicData(tokenAddress: string, chain: Chain): Promise<PrismaTokenDynamicData | null> {
        const token = await prisma.prismaToken.findUnique({
            where: {
                address_chain: {
                    address: tokenAddress.toLowerCase(),
                    chain: chain,
                },
            },
            include: {
                dynamicData: true,
            },
        });

        if (token) {
            return token.dynamicData;
        }

        return null;
    }

    public async getTokensDynamicData(tokenAddresses: string[], chain: Chain): Promise<PrismaTokenDynamicData[]> {
        const tokens = await prisma.prismaToken.findMany({
            where: {
                address: { in: tokenAddresses.map((address) => address.toLowerCase()) },
                chain: chain,
            },
            include: {
                dynamicData: true,
            },
        });

        // why doesn't this work with map??
        const dynamicData: PrismaTokenDynamicData[] = [];
        for (const token of tokens) {
            if (token.dynamicData) {
                dynamicData.push(token.dynamicData);
            }
        }

        return dynamicData;
    }

    public async getDataForRange(
        tokenAddress: string,
        range: GqlTokenChartDataRange,
        chain: Chain,
    ): Promise<PrismaTokenPrice[]> {
        return this.tokenPriceService.getDataForRange(tokenAddress, range, chain);
    }

    public async getRelativeDataForRange(
        tokenIn: string,
        tokenOut: string,
        range: GqlTokenChartDataRange,
        chain: Chain,
    ): Promise<TokenPriceItem[]> {
        return this.tokenPriceService.getRelativeDataForRange(tokenIn, tokenOut, range, chain);
    }

    public async initChartData(tokenAddress: string) {
        await this.coingeckoDataService.initChartData(tokenAddress);
    }

    public async getTokenPriceFrom24hAgo(): Promise<PrismaTokenCurrentPrice[]> {
        let tokenPrices24hAgo = this.cache.get(`${TOKEN_PRICES_24H_AGO_CACHE_KEY}:${networkContext.chain}`);
        if (!tokenPrices24hAgo) {
            tokenPrices24hAgo = await this.tokenPriceService.getTokenPricesFrom24hAgo();
            this.cache.put(
                `${TOKEN_PRICES_24H_AGO_CACHE_KEY}:${networkContext.chain}`,
                tokenPrices24hAgo,
                60 * 15 * 1000,
            );
        }
        return tokenPrices24hAgo;
    }

    public async getHistoricalTokenPrices(chain: Chain) {
        return this.tokenPriceService.getHistoricalTokenPrices(chain);
    }

    public async purgeOldTokenPricesForAllChains() {
        return this.tokenPriceService.purgeOldTokenPricesForAllChains();
    }

    public async deleteTokenPrice(args: MutationTokenDeletePriceArgs) {
        return this.tokenPriceService.deleteTokenPrice(args);
    }

    public async deleteTokenType({ tokenAddress, type }: MutationTokenDeleteTokenTypeArgs) {
        await prisma.prismaTokenType.delete({
            where: {
                tokenAddress_type_chain: {
                    tokenAddress,
                    type,
                    chain: networkContext.chain,
                },
            },
        });
    }
    public async reloadAllTokenTypes() {
        await prisma.prismaTokenType.deleteMany({
            where: { chain: networkContext.chain },
        });
        await networkContext.config.contentService.syncTokenContentData();
    }
}

export const tokenService = new TokenService(new TokenPriceService(), new CoingeckoDataService(coingeckoService));
