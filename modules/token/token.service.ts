import { TokenDefinition, TokenPriceItem } from './token-types';
import { prisma } from '../../prisma/prisma-client';
import { TokenPriceService } from './lib/token-price.service';
import { PrismaToken, PrismaTokenCurrentPrice, PrismaTokenDynamicData, PrismaTokenPrice } from '@prisma/client';
import { CoingeckoDataService } from './lib/coingecko-data.service';
import { Cache, CacheClass } from 'memory-cache';
import { GqlTokenChartDataRange, MutationTokenDeletePriceArgs, MutationTokenDeleteTokenTypeArgs } from '../../schema';
import { coingeckoService } from '../coingecko/coingecko.service';
import { networkContext } from '../network/network-context.service';
import { getContractAt } from '../web3/contract';
import ERC20Abi from '../web3/abi/ERC20.json';
import { BigNumber } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { add } from 'lodash';

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

    public async getToken(address: string): Promise<PrismaToken | null> {
        return prisma.prismaToken.findUnique({
            where: {
                address_chain: {
                    address: address.toLowerCase(),
                    chain: networkContext.chain,
                },
            },
        });
    }

    public async getTokens(addresses?: string[]): Promise<PrismaToken[]> {
        let tokens: PrismaToken[] | null = this.cache.get(`${ALL_TOKENS_CACHE_KEY}:${networkContext.chainId}`);
        if (!tokens) {
            tokens = await prisma.prismaToken.findMany({ where: { chain: networkContext.chain } });
            this.cache.put(`${ALL_TOKENS_CACHE_KEY}:${networkContext.chainId}`, tokens, 5 * 60 * 1000);
        }
        if (addresses) {
            return tokens.filter((token) => addresses.includes(token.address));
        }
        return tokens;
    }

    public async getTokenDefinitions(): Promise<TokenDefinition[]> {
        const tokens = await prisma.prismaToken.findMany({
            where: { types: { some: { type: 'WHITE_LISTED' } }, chain: networkContext.chain },
            include: { types: true },
            orderBy: { priority: 'desc' },
        });

        const weth = tokens.find((token) => token.address === networkContext.data.weth.address);

        if (weth) {
            tokens.push({
                ...weth,
                name: networkContext.data.eth.name,
                address: networkContext.data.eth.address,
                symbol: networkContext.data.eth.symbol,
            });
        }

        return tokens.map((token) => ({
            ...token,
            chainId: networkContext.data.chain.id,
            //TODO: some linear wrapped tokens are tradable. ie: xBOO
            tradable: !token.types.find(
                (type) => type.type === 'PHANTOM_BPT' || type.type === 'BPT' || type.type === 'LINEAR_WRAPPED_TOKEN',
            ),
        }));
    }

    public async updateTokenPrices(): Promise<void> {
        return this.tokenPriceService.updateTokenPrices();
    }

    public async getTokenPrices(): Promise<PrismaTokenCurrentPrice[]> {
        let tokenPrices = this.cache.get(`${TOKEN_PRICES_CACHE_KEY}:${networkContext.chainId}`);
        if (!tokenPrices) {
            tokenPrices = await this.tokenPriceService.getCurrentTokenPrices();
            this.cache.put(`${TOKEN_PRICES_CACHE_KEY}:${networkContext.chainId}`, tokenPrices, 30 * 1000);
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

    public async getTokenDynamicData(tokenAddress: string): Promise<PrismaTokenDynamicData | null> {
        const token = await prisma.prismaToken.findUnique({
            where: {
                address_chain: {
                    address: tokenAddress.toLowerCase(),
                    chain: networkContext.chain,
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

    public async getTokensDynamicData(tokenAddresses: string[]): Promise<PrismaTokenDynamicData[]> {
        const tokens = await prisma.prismaToken.findMany({
            where: {
                address: { in: tokenAddresses.map((address) => address.toLowerCase()) },
                chain: networkContext.chain,
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

    public async getTokenPriceFrom24hAgo(): Promise<PrismaTokenCurrentPrice[]> {
        let tokenPrices24hAgo = this.cache.get(`${TOKEN_PRICES_24H_AGO_CACHE_KEY}:${networkContext.chainId}`);
        if (!tokenPrices24hAgo) {
            tokenPrices24hAgo = await this.tokenPriceService.getTokenPriceFrom24hAgo();
            this.cache.put(
                `${TOKEN_PRICES_24H_AGO_CACHE_KEY}:${networkContext.chainId}`,
                tokenPrices24hAgo,
                60 * 15 * 1000,
            );
        }
        return tokenPrices24hAgo;
    }

    public async getHistoricalTokenPrices() {
        return this.tokenPriceService.getHistoricalTokenPrices();
    }

    public async purgeOldTokenPrices(): Promise<number> {
        return this.tokenPriceService.purgeOldTokenPrices();
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
