import { TokenPriceItem } from './token-types';
import { prisma } from '../../prisma/prisma-client';
import { TokenPriceService } from './lib/token-price.service';
import {
    Chain,
    Prisma,
    PrismaToken,
    PrismaTokenCurrentPrice,
    PrismaTokenDynamicData,
    PrismaTokenPrice,
    PrismaTokenTypeOption,
} from '@prisma/client';
import { CoingeckoDataService } from './lib/coingecko-data.service';
import { Cache, CacheClass } from 'memory-cache';
import {
    Erc4626ReviewData,
    GqlPriceRateProviderData,
    GqlToken,
    GqlTokenChartDataRange,
    MutationTokenDeleteTokenTypeArgs,
    QueryTokenGetTokensArgs,
} from '../../apps/api/gql/generated-schema';
import { Dictionary } from 'lodash';
import { GithubContentService } from '../content/github-content.service';
import config from '../../config';
import murmurhash from 'murmurhash';

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

    public async syncTokenContentData(chain: Chain, deploymentEnv = process.env.DEPLOYMENT_ENV) {
        //sync coingecko Ids first, then override Ids from the content service
        const chains = Object.keys(config).filter(
            (chain) => (deploymentEnv === 'production' && chain !== 'SEPOLIA') || true,
        ) as Chain[];

        await this.coingeckoDataService.syncCoingeckoIds();
        await new GithubContentService().syncTokenContentData(chains);
    }

    public async getToken(address: string, chain: Chain): Promise<PrismaToken | null> {
        return prisma.prismaToken.findUnique({
            where: {
                address_chain: {
                    address: address.toLowerCase(),
                    chain,
                },
            },
        });
    }

    /**
     * Use cached tokens to get decimals from memory to enable fast SOR lookups without hitting the database.
     * @param chain
     */
    async getTokenDecimals(address: string, chain: Chain): Promise<number | undefined> {
        const tokens = await this.getTokens(chain, [address]);
        if (tokens.length === 0) return;

        return tokens[0].decimals;
    }

    public async getTokens(chain: Chain, addresses?: string[]): Promise<PrismaToken[]> {
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

    public async getTokenDefinition(address: string, chain: Chain): Promise<GqlToken | undefined> {
        const token = await prisma.prismaToken.findUnique({
            where: { address_chain: { address: address, chain: chain } },
            include: { types: true },
        });

        if (token) {
            const rateProviderData = await this.getPriceRateProviderData([token]);
            const erc4626Data = await this.getErc4626Data([token]);
            return {
                ...token,
                types: token.types.map((type) => type.type),
                isBufferAllowed: token.isBufferAllowed,
                chainId: config[chain].chain.id,
                tradable: !token.types.find((type) => type.type === 'PHANTOM_BPT' || type.type === 'BPT'),
                rateProviderData: rateProviderData[token.address],
                coingeckoId: token.coingeckoTokenId,
                isErc4626: token.types.some((type) => type.type === 'ERC4626'),
                erc4626ReviewData: erc4626Data[`${token.address}-${token.chain}`],
            };
        }

        return undefined;
    }

    public async getTokenDefinitions(args: QueryTokenGetTokensArgs): Promise<GqlToken[]> {
        const chains = args.chains!;
        const types = (args.where?.typeIn || []) as PrismaTokenTypeOption[];
        const where: Prisma.PrismaTokenWhereInput = {
            chain: { in: chains },
        };

        if (args.where?.tokensIn) {
            where.address = { in: args.where.tokensIn };
        }

        console.time('prismaToken.findMany');
        const [dbTokens, typesMap] = await Promise.all([
            prisma.prismaToken.findMany({
                where,
                orderBy: { tvl: 'desc' },
            }),
            prisma.prismaTokenType
                .findMany({
                    where: {
                        chain: {
                            in: chains,
                        },
                    },
                })
                .then((types) =>
                    types.reduce((agg, item) => {
                        agg[`${item.chain}-${item.tokenAddress}`] ||= [];
                        agg[`${item.chain}-${item.tokenAddress}`].push(item.type);
                        return agg;
                    }, {} as Record<string, PrismaTokenTypeOption[]>),
                ),
        ]);

        const tokens = dbTokens
            .map((token) => ({ ...token, types: typesMap[`${token.chain}-${token.address}`] || [] }))
            .filter(
                (token) =>
                    // Always include veBal
                    (token.chain === 'MAINNET' && token.address === config['MAINNET'].veBal?.bptAddress) ||
                    // Always include WHITE_LISTED
                    token.types.includes('WHITE_LISTED') ||
                    // Exclude BPT tokens
                    (!(['BPT', 'PHANTOM_BPT'] as PrismaTokenTypeOption[]).some((type) => token.types.includes(type)) &&
                        // Exclude Circles
                        !(token.chain === 'GNOSIS' && token.name.startsWith('Circles-'))),
            )
            .filter((token) => types.every((type) => token.types.includes(type)));

        // Use once prisma is setup with relationJoins, otherwise fails with too many bindings
        // if (args.where?.typeIn) {
        //     where.types = { some: { type: { in: args.where.typeIn } } };
        // }
        // const tokens = await prisma.prismaToken
        //     .findMany({
        //         where,
        //         include: {
        //             types: true,
        //         },
        //         orderBy: { tvl: 'desc' },
        //     })
        //     .then((tokens) => tokens.map((token) => ({ ...token, types: token.types.map((type) => type.type) || [] })));
        console.timeEnd('prismaToken.findMany');

        for (const chain of chains) {
            const weth = tokens.find((token) => token.chain === chain && token.address === config[chain].weth.address);

            if (weth) {
                tokens.push({
                    ...weth,
                    name: config[chain].eth.name,
                    address: config[chain].eth.address,
                    symbol: config[chain].eth.symbol,
                    chain: config[chain].chain.prismaId,
                });
            }
        }

        console.time('getPriceRateProviderData');
        const rateProviderData = await this.getPriceRateProviderData(tokens, chains);
        console.timeEnd('getPriceRateProviderData');

        console.time('getErc4626Data');
        const erc4626Data = await this.getErc4626Data(tokens);
        console.timeEnd('getErc4626Data');

        return tokens.map((token) => ({
            ...token,
            chainId: config[token.chain].chain.id,
            tradable: !token.types.find((type) => type === 'PHANTOM_BPT' || type === 'BPT'),
            rateProviderData: rateProviderData[token.address],
            priceRateProviderData: rateProviderData[token.address],
            coingeckoId: token.coingeckoTokenId,
            isErc4626: token.types.some((type) => type === 'ERC4626'),
            underlyingTokenAddress: token.underlyingTokenAddress,
            erc4626ReviewData: erc4626Data[`${token.address}-${token.chain}`],
        }));
    }

    private async getPriceRateProviderData(
        tokens: PrismaToken[],
        chains?: Chain[],
    ): Promise<Record<string, GqlPriceRateProviderData | undefined>> {
        const priceRateProviders = await prisma.prismaPriceRateProviderData.findMany({
            where: {
                ...(tokens.length < 20
                    ? {
                          tokenAddress: {
                              in: tokens.map((t) => t.address),
                          },
                      }
                    : {}),
                ...(chains
                    ? {
                          chain: {
                              in: chains,
                          },
                      }
                    : {}),
            },
        });

        const priceRateProviderDataResult: Record<string, GqlPriceRateProviderData | undefined> = {};

        for (const token of tokens) {
            const providersForToken = priceRateProviders.filter(
                (provider) => provider.tokenAddress === token.address && provider.chain === token.chain,
            );

            if (providersForToken.length === 1) {
                priceRateProviderDataResult[token.address] = {
                    ...providersForToken[0],
                    warnings: providersForToken[0].warnings?.split(',') || [],
                    address: providersForToken[0].rateProviderAddress,
                };
            } else if (providersForToken.length > 1) {
                // need to find the "preferred" price rate provider
                // only return the safe one
                // if all are reviewed and safe, we can just return the first one
                for (const provider of providersForToken) {
                    if (provider.reviewed && provider.summary === 'safe') {
                        priceRateProviderDataResult[token.address] = {
                            ...provider,
                            warnings: provider.warnings?.split(',') || [],
                            address: provider.rateProviderAddress,
                        };
                    }
                }
            } else {
                priceRateProviderDataResult[token.address] = undefined;
            }
        }
        return priceRateProviderDataResult;
    }

    async getErc4626Data(
        tokens?: PrismaToken[],
    ): Promise<
        Record<string, (Erc4626ReviewData & { erc4626Address: string; assetAddress: string; chain: Chain }) | undefined>
    > {
        const cacheKey = `ERC4626REVIEWDATA-${murmurhash.v3(`${tokens}`).toString(36)}`;

        let erc4626Data: Record<
            string,
            Erc4626ReviewData & { erc4626Address: string; assetAddress: string; chain: Chain }
        > = this.cache.get(cacheKey);

        if (!erc4626Data) {
            erc4626Data = await prisma.prismaErc4626ReviewData
                .findMany()
                .then((reviews) => {
                    // Remove all duplicates, keeping only items that appear exactly once
                    const addressChainCounts = new Map<string, number>();

                    reviews.forEach((review) => {
                        const key = `${review.erc4626Address}-${review.chain}`;
                        addressChainCounts.set(key, (addressChainCounts.get(key) || 0) + 1);
                    });

                    const noDuplicatesReviews = reviews.filter((review) => {
                        const key = `${review.erc4626Address}-${review.chain}`;
                        return addressChainCounts.get(key) === 1;
                    });

                    return noDuplicatesReviews;
                })
                .then((reviews) =>
                    reviews.map((review) => ({
                        ...review,
                        warnings: review.warnings?.split(',') || [],
                    })),
                )
                .then((reviews) =>
                    Object.fromEntries(reviews.map((review) => [`${review.erc4626Address}-${review.chain}`, review])),
                );
            this.cache.put(cacheKey, erc4626Data, 10 * 60 * 1000); // cache for 10 min
        }

        return erc4626Data;
    }

    public async getTokenPrices(chain: Chain): Promise<PrismaTokenCurrentPrice[]> {
        let tokenPrices = this.cache.get(`${TOKEN_PRICES_CACHE_KEY}:${chain}`);
        if (!tokenPrices) {
            tokenPrices = await this.tokenPriceService.getCurrentTokenPrices([chain]);
            this.cache.put(`${TOKEN_PRICES_CACHE_KEY}:${chain}`, tokenPrices, 60 * 1000);
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

    public async getCurrentTokenPrices(chains: Chain[]): Promise<PrismaTokenCurrentPrice[]> {
        return this.tokenPriceService.getCurrentTokenPrices(chains);
    }

    public async getProtocolTokenPrice(chain: Chain): Promise<string> {
        const tokenPrices = await tokenService.getTokenPrices(chain);

        if (config[chain].protocolToken === 'bal') {
            return tokenService.getPriceForToken(tokenPrices, config[chain].bal!.address, chain).toString();
        } else {
            return tokenService.getPriceForToken(tokenPrices, config[chain].beets!.address, chain).toString();
        }
    }

    public getPriceForToken(tokenPrices: PrismaTokenCurrentPrice[], tokenAddress: string, chain: Chain): number {
        return this.tokenPriceService.getPriceForToken(tokenPrices, tokenAddress, chain);
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

    public async getTokenPricesForRange(
        tokenAddress: string[],
        range: GqlTokenChartDataRange,
        chain: Chain,
    ): Promise<PrismaTokenPrice[]> {
        return this.tokenPriceService.getTokenPricesForRange(tokenAddress, range, chain);
    }

    public async getTokenPriceForRange(
        tokenAddress: string,
        range: GqlTokenChartDataRange,
        chain: Chain,
    ): Promise<PrismaTokenPrice[]> {
        return this.tokenPriceService.getTokenPricesForRange([tokenAddress], range, chain);
    }

    public async getRelativeDataForRange(
        tokenIn: string,
        tokenOut: string,
        range: GqlTokenChartDataRange,
        chain: Chain,
    ): Promise<TokenPriceItem[]> {
        return this.tokenPriceService.getRelativeDataForRange(tokenIn, tokenOut, range, chain);
    }

    public async getTokenPriceFrom24hAgo(chain: Chain): Promise<PrismaTokenCurrentPrice[]> {
        let tokenPrices24hAgo = this.cache.get(`${TOKEN_PRICES_24H_AGO_CACHE_KEY}:${chain}`);
        if (!tokenPrices24hAgo) {
            tokenPrices24hAgo = await this.tokenPriceService.getTokenPricesFrom24hAgo([chain]);
            this.cache.put(`${TOKEN_PRICES_24H_AGO_CACHE_KEY}:${chain}`, tokenPrices24hAgo, 60 * 15 * 1000);
        }
        return tokenPrices24hAgo;
    }

    public async purgeOldTokenPricesForAllChains() {
        return this.tokenPriceService.purgeOldTokenPricesForAllChains();
    }

    public async deleteTokenType({ tokenAddress, type }: MutationTokenDeleteTokenTypeArgs, chain: Chain) {
        await prisma.prismaTokenType.delete({
            where: {
                tokenAddress_type_chain: {
                    tokenAddress,
                    type,
                    chain,
                },
            },
        });
    }
    public async reloadAllTokenTypes(chain: Chain) {
        await prisma.prismaTokenType.deleteMany({
            where: { chain },
        });

        const githubContentService = new GithubContentService();
        await githubContentService.syncTokenContentData([chain]);
    }
}

export const tokenService = new TokenService(new TokenPriceService(), new CoingeckoDataService());
