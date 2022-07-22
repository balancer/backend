import {
    PrismaNestedPoolWithNoNesting,
    PrismaNestedPoolWithSingleLayerNesting,
    prismaPoolMinimal,
    PrismaPoolMinimal,
    PrismaPoolTokenWithDynamicData,
    PrismaPoolTokenWithExpandedNesting,
    prismaPoolWithExpandedNesting,
    PrismaPoolWithExpandedNesting,
} from '../../../prisma/prisma-types';
import {
    GqlPoolDynamicData,
    GqlPoolFeaturedPoolGroup,
    GqlPoolInvestConfig,
    GqlPoolInvestOption,
    GqlPoolLinear,
    GqlPoolLinearNested,
    GqlPoolMinimal,
    GqlPoolNestingType,
    GqlPoolPhantomStableNested,
    GqlPoolToken,
    GqlPoolTokenExpanded,
    GqlPoolTokenUnion,
    GqlPoolUnion,
    GqlPoolWithdrawConfig,
    GqlPoolWithdrawOption,
    QueryPoolGetPoolsArgs,
} from '../../../schema';
import { isSameAddress } from '@balancer-labs/sdk';
import _ from 'lodash';
import { prisma } from '../../util/prisma-client';
import { networkConfig } from '../../config/network-config';
import { Prisma } from '@prisma/client';
import { ConfigService } from '../../config/config.service';

export class PoolGqlLoaderService {
    constructor(private readonly configService: ConfigService) {}

    public async getPool(id: string): Promise<GqlPoolUnion> {
        const pool = await prisma.prismaPool.findUnique({
            where: { id },
            include: prismaPoolWithExpandedNesting.include,
        });

        if (!pool) {
            throw new Error('Pool with id does not exist');
        }

        if (pool.type === 'UNKNOWN') {
            throw new Error('Pool exists, but has an unknown type');
        }

        return this.mapPoolToGqlPool(pool);
    }

    public async getPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolMinimal[]> {
        const pools = await prisma.prismaPool.findMany({
            ...this.mapQueryArgsToPoolQuery(args),
            include: prismaPoolMinimal.include,
        });

        return pools.map((pool) => {
            return {
                ...pool,
                decimals: 18,
                dynamicData: this.getPoolDynamicData(pool),
                allTokens: this.mapAllTokens(pool),
            };
        });
    }

    public async getPoolsCount(args: QueryPoolGetPoolsArgs): Promise<number> {
        return prisma.prismaPool.count({ where: this.mapQueryArgsToPoolQuery(args).where });
    }

    public async getFeaturedPoolGroups(): Promise<GqlPoolFeaturedPoolGroup[]> {
        const { featuredPoolGroups } = await this.configService.getHomeScreenConfig();
        const poolIds = featuredPoolGroups
            .map((group) =>
                group.items
                    .filter((item) => item._type === 'homeScreenFeaturedPoolGroupPoolId')
                    .map((item) => (item._type === 'homeScreenFeaturedPoolGroupPoolId' ? item.poolId : '')),
            )
            .flat();

        const pools = await this.getPools({ where: { idIn: poolIds } });

        return featuredPoolGroups.map((group) => {
            return {
                ...group,
                items: group.items
                    //filter out any invalid pool ids
                    .filter((item) => {
                        if (item._type === 'homeScreenFeaturedPoolGroupPoolId') {
                            return !!pools.find((pool) => pool.id === item.poolId);
                        }

                        return true;
                    })
                    .map((item) => {
                        if (item._type === 'homeScreenFeaturedPoolGroupPoolId') {
                            const pool = pools.find((pool) => pool.id === item.poolId);

                            return { __typename: 'GqlPoolMinimal', ...pool! };
                        } else {
                            return { __typename: 'GqlFeaturePoolGroupItemExternalLink', ...item };
                        }
                    }),
            };
        });
    }

    private mapQueryArgsToPoolQuery(args: QueryPoolGetPoolsArgs): Prisma.PrismaPoolFindManyArgs {
        let orderBy: Prisma.PrismaPoolOrderByWithRelationInput = {};
        const orderDirection = args.orderDirection || undefined;

        switch (args.orderBy) {
            case 'totalLiquidity':
                orderBy = { dynamicData: { totalLiquidity: orderDirection } };
                break;
            case 'totalShares':
                orderBy = { dynamicData: { totalShares: orderDirection } };
                break;
            case 'volume24h':
                orderBy = { dynamicData: { volume24h: orderDirection } };
                break;
            case 'fees24h':
                orderBy = { dynamicData: { fees24h: orderDirection } };
                break;
            case 'apr':
                orderBy = { dynamicData: { apr: orderDirection } };
                break;
        }

        const baseQuery: Prisma.PrismaPoolFindManyArgs = {
            take: args.first || undefined,
            skip: args.skip || undefined,
            orderBy,
        };

        if (!args.where && !args.textSearch) {
            return {
                ...baseQuery,
                where: {
                    categories: {
                        none: { category: 'BLACK_LISTED' },
                    },
                    dynamicData: {
                        totalSharesNum: {
                            gt: 0.000000000001,
                        },
                    },
                },
            };
        }

        const where = args.where;
        const textSearch = args.textSearch ? { contains: args.textSearch, mode: 'insensitive' as const } : undefined;
        const filterArgs: Prisma.PrismaPoolWhereInput = {
            dynamicData: {
                totalSharesNum: {
                    gt: 0.000000000001,
                },
            },
            type: {
                in: where?.poolTypeIn || undefined,
                notIn: where?.poolTypeNotIn || undefined,
            },
            allTokens: {
                ...(where?.tokensNotIn
                    ? {
                          every: {
                              token: {
                                  address: {
                                      notIn: where?.tokensNotIn || undefined,
                                      mode: 'insensitive',
                                  },
                              },
                          },
                      }
                    : {}),
                some: {
                    token: {
                        address: {
                            in: where?.tokensIn || undefined,
                            mode: 'insensitive',
                        },
                    },
                },
            },
            id: {
                in: where?.idIn || undefined,
                notIn: where?.idNotIn || undefined,
                mode: 'insensitive',
            },
            categories: {
                every: {
                    category: {
                        notIn: ['BLACK_LISTED', ...(where?.categoryNotIn || [])],
                    },
                },
                ...(where?.categoryIn
                    ? {
                          some: {
                              category: {
                                  in: where.categoryIn,
                              },
                          },
                      }
                    : {}),
            },
            filters: {
                ...(where?.filterNotIn
                    ? {
                          every: {
                              filterId: {
                                  notIn: where.filterNotIn,
                              },
                          },
                      }
                    : {}),
                ...(where?.filterIn
                    ? {
                          some: {
                              filterId: {
                                  in: where.filterIn,
                              },
                          },
                      }
                    : {}),
            },
        };

        if (!textSearch) {
            return {
                ...baseQuery,
                where: filterArgs,
            };
        }

        return {
            ...baseQuery,
            where: {
                OR: [
                    { name: textSearch, ...filterArgs },
                    { symbol: textSearch, ...filterArgs },
                    {
                        ...filterArgs,
                        allTokens: {
                            some: {
                                OR: [
                                    {
                                        token: {
                                            name: textSearch,
                                            address: filterArgs.allTokens?.some?.token?.address,
                                        },
                                    },
                                    {
                                        token: {
                                            symbol: textSearch,
                                            address: filterArgs.allTokens?.some?.token?.address,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ],
            },
        };
    }

    private mapPoolToGqlPool(pool: PrismaPoolWithExpandedNesting): GqlPoolUnion {
        const mappedData = {
            ...pool,
            decimals: 18,
            dynamicData: this.getPoolDynamicData(pool),
            investConfig: this.getPoolInvestConfig(pool),
            withdrawConfig: this.getPoolWithdrawConfig(pool),
            nestingType: this.getPoolNestingType(pool),
            tokens: pool.tokens
                .filter((token) => token.address !== pool.address)
                .map((token) => this.mapPoolTokenToGqlUnion(token)),
            allTokens: this.mapAllTokens(pool),
        };

        //TODO: may need to build out the types here still
        switch (pool.type) {
            case 'STABLE':
            case 'META_STABLE':
                return {
                    __typename: 'GqlPoolStable',
                    ...mappedData,
                    amp: pool.stableDynamicData?.amp || '0',
                    tokens: mappedData.tokens as GqlPoolToken[],
                };
            case 'PHANTOM_STABLE':
                return {
                    __typename: 'GqlPoolPhantomStable',
                    ...mappedData,
                    amp: pool.stableDynamicData?.amp || '0',
                };
            case 'LINEAR':
                return {
                    __typename: 'GqlPoolLinear',
                    ...mappedData,
                    tokens: mappedData.tokens as GqlPoolToken[],
                    mainIndex: pool.linearData?.mainIndex || 0,
                    wrappedIndex: pool.linearData?.wrappedIndex || 0,
                    lowerTarget: pool.linearDynamicData?.lowerTarget || '0',
                    upperTarget: pool.linearDynamicData?.upperTarget || '0',
                };
            case 'ELEMENT':
                return {
                    __typename: 'GqlPoolElement',
                    ...mappedData,
                    tokens: mappedData.tokens as GqlPoolToken[],
                    baseToken: pool.elementData?.baseToken || '',
                    unitSeconds: pool.elementData?.unitSeconds || '',
                    principalToken: pool.elementData?.principalToken || '',
                };
            case 'LIQUIDITY_BOOTSTRAPPING':
                return {
                    __typename: 'GqlPoolLiquidityBootstrapping',
                    ...mappedData,
                };
        }

        return {
            __typename: 'GqlPoolWeighted',
            ...mappedData,
        };
    }

    private mapAllTokens(pool: PrismaPoolMinimal): GqlPoolTokenExpanded[] {
        return pool.allTokens.map((token) => {
            const poolToken = pool.tokens.find((poolToken) => poolToken.address === token.token.address);

            return {
                ...token.token,
                id: `${pool.id}-${token.tokenAddress}`,
                weight: poolToken?.dynamicData?.weight,
                isNested: !poolToken,
                isPhantomBpt: token.tokenAddress === pool.address,
            };
        });
    }

    private getPoolDynamicData(pool: PrismaPoolMinimal): GqlPoolDynamicData {
        const { fees24h, totalLiquidity, volume24h, fees48h, volume48h, totalLiquidity24hAgo } = pool.dynamicData!;
        const aprItems = pool.aprItems || [];
        const swapAprItems = aprItems.filter((item) => item.type == 'SWAP_FEE');
        const nativeRewardAprItems = aprItems.filter((item) => item.type === 'NATIVE_REWARD');
        const thirdPartyRewardAprItems = aprItems.filter((item) => item.type === 'THIRD_PARTY_REWARD');
        const aprItemsWithNoGroup = aprItems.filter((item) => !item.group);

        const grouped = _.groupBy(
            aprItems.filter((item) => item.group),
            (item) => item.group,
        );

        return {
            ...pool.dynamicData!,
            totalLiquidity: `${totalLiquidity}`,
            totalLiquidity24hAgo: `${totalLiquidity24hAgo}`,
            fees24h: `${fees24h}`,
            volume24h: `${volume24h}`,
            fees48h: `${fees48h}`,
            volume48h: `${volume48h}`,
            apr: {
                total: `${_.sumBy(aprItems, 'apr')}`,
                swapApr: `${_.sumBy(swapAprItems, 'apr')}`,
                nativeRewardApr: `${_.sumBy(nativeRewardAprItems, 'apr')}`,
                thirdPartyApr: `${_.sumBy(thirdPartyRewardAprItems, 'apr')}`,
                items: [
                    ...aprItemsWithNoGroup.map((item) => ({
                        ...item,
                        apr: `${item.apr}`,
                        subItems: [],
                    })),
                    ..._.map(grouped, (items, group) => {
                        const subItems = items.map((item) => ({ ...item, apr: `${item.apr}` }));
                        const apr = _.sumBy(items, 'apr');
                        let title = '';

                        switch (group) {
                            case 'YEARN':
                                title = 'Yearn boosted APR';
                                break;
                        }

                        return {
                            title,
                            apr: `${apr}`,
                            subItems,
                        };
                    }),
                ],
                hasRewardApr: nativeRewardAprItems.length > 0 || thirdPartyRewardAprItems.length > 0,
            },
        };
    }

    private getPoolInvestConfig(pool: PrismaPoolWithExpandedNesting): GqlPoolInvestConfig {
        const poolTokens = pool.tokens.filter((token) => token.address !== pool.address);
        const supportsNativeAssetDeposit = pool.type !== 'PHANTOM_STABLE';
        let options: GqlPoolInvestOption[] = [];

        for (const poolToken of poolTokens) {
            options = [...options, ...this.getActionOptionsForPoolToken(pool, poolToken, supportsNativeAssetDeposit)];
        }

        return {
            //TODO could flag these as disabled in sanity
            proportionalEnabled: true,
            singleAssetEnabled: true,
            options,
        };
    }

    private getPoolWithdrawConfig(pool: PrismaPoolWithExpandedNesting): GqlPoolWithdrawConfig {
        const poolTokens = pool.tokens.filter((token) => token.address !== pool.address);
        let options: GqlPoolWithdrawOption[] = [];

        for (const poolToken of poolTokens) {
            options = [...options, ...this.getActionOptionsForPoolToken(pool, poolToken, false)];
        }

        return {
            //TODO could flag these as disabled in sanity
            proportionalEnabled: true,
            singleAssetEnabled: true,
            options,
        };
    }

    private getActionOptionsForPoolToken(
        pool: PrismaPoolWithExpandedNesting,
        poolToken: PrismaPoolTokenWithExpandedNesting,
        supportsNativeAsset: boolean,
    ): { poolTokenAddress: string; poolTokenIndex: number; tokenOptions: GqlPoolToken[] }[] {
        const nestedPool = poolToken.nestedPool;
        const options: GqlPoolInvestOption[] = [];

        if (nestedPool && nestedPool.type === 'LINEAR' && nestedPool.linearData) {
            const mainToken = nestedPool.tokens[nestedPool.linearData.mainIndex];
            const isWrappedNativeAsset = isSameAddress(mainToken.address, networkConfig.weth.address);

            options.push({
                poolTokenIndex: poolToken.index,
                poolTokenAddress: poolToken.address,
                tokenOptions:
                    //TODO: will be good to add support for depositing the wrapped token for the linear pool
                    isWrappedNativeAsset && supportsNativeAsset
                        ? [
                              this.mapPoolTokenToGql(mainToken),
                              this.mapPoolTokenToGql({
                                  ...mainToken,
                                  token: {
                                      ...poolToken.token,
                                      symbol: networkConfig.eth.symbol,
                                      address: networkConfig.eth.address,
                                      name: networkConfig.eth.name,
                                  },
                                  id: `${pool.id}-${networkConfig.eth.address}`,
                              }),
                          ]
                        : [this.mapPoolTokenToGql(mainToken)],
            });
        } else if (nestedPool && nestedPool.type === 'PHANTOM_STABLE') {
            const nestedTokens = nestedPool.tokens.filter((token) => token.address !== nestedPool.address);

            if (pool.type === 'PHANTOM_STABLE') {
                //when nesting a phantom stable inside a phantom stable, all of the underlying tokens can be used when investing
                for (const nestedToken of nestedTokens) {
                    options.push({
                        poolTokenIndex: poolToken.index,
                        poolTokenAddress: poolToken.address,
                        tokenOptions:
                            nestedToken.nestedPool &&
                            nestedToken.nestedPool.type === 'LINEAR' &&
                            nestedToken.nestedPool.linearData
                                ? [
                                      this.mapPoolTokenToGql(
                                          nestedToken.nestedPool.tokens[nestedToken.nestedPool.linearData.mainIndex],
                                      ),
                                  ]
                                : [this.mapPoolTokenToGql(nestedToken)],
                    });
                }
            } else {
                //if the parent pool does not have phantom bpt (ie: weighted), the user can only invest with 1 of the phantom stable tokens
                options.push({
                    poolTokenIndex: poolToken.index,
                    poolTokenAddress: poolToken.address,
                    tokenOptions: nestedTokens.map((nestedToken) => {
                        if (
                            nestedToken.nestedPool &&
                            nestedToken.nestedPool.type === 'LINEAR' &&
                            nestedToken.nestedPool.linearData
                        ) {
                            return this.mapPoolTokenToGql(
                                nestedToken.nestedPool.tokens[nestedToken.nestedPool.linearData.mainIndex],
                            );
                        }

                        return this.mapPoolTokenToGql(nestedToken);
                    }),
                });
            }
        } else {
            const isWrappedNativeAsset = isSameAddress(poolToken.address, networkConfig.weth.address);

            options.push({
                poolTokenIndex: poolToken.index,
                poolTokenAddress: poolToken.address,
                tokenOptions:
                    isWrappedNativeAsset && supportsNativeAsset
                        ? [
                              this.mapPoolTokenToGql(poolToken),
                              this.mapPoolTokenToGql({
                                  ...poolToken,
                                  token: {
                                      ...poolToken.token,
                                      symbol: networkConfig.eth.symbol,
                                      address: networkConfig.eth.address,
                                      name: networkConfig.eth.name,
                                  },
                                  id: `${pool.id}-${networkConfig.eth.address}`,
                              }),
                          ]
                        : [this.mapPoolTokenToGql(poolToken)],
            });
        }

        return options;
    }

    private mapPoolTokenToGqlUnion(token: PrismaPoolTokenWithExpandedNesting): GqlPoolTokenUnion {
        const { nestedPool } = token;

        if (nestedPool && nestedPool.type === 'LINEAR') {
            const totalShares = parseFloat(nestedPool.dynamicData?.totalShares || '0');
            const percentOfSupplyNested =
                totalShares > 0 ? parseFloat(token.dynamicData?.balance || '0') / totalShares : 0;

            return {
                ...this.mapPoolTokenToGql(token),
                __typename: 'GqlPoolTokenLinear',
                ...this.getLinearPoolTokenData(token, nestedPool),
                pool: this.mapNestedPoolToGqlPoolLinearNested(nestedPool, percentOfSupplyNested),
            };
        } else if (nestedPool && nestedPool.type === 'PHANTOM_STABLE') {
            const totalShares = parseFloat(nestedPool.dynamicData?.totalShares || '0');
            const percentOfSupplyNested =
                totalShares > 0 ? parseFloat(token.dynamicData?.balance || '0') / totalShares : 0;

            return {
                ...this.mapPoolTokenToGql(token),
                __typename: 'GqlPoolTokenPhantomStable',
                pool: this.mapNestedPoolToGqlPoolPhantomStableNested(nestedPool, percentOfSupplyNested),
            };
        }

        return this.mapPoolTokenToGql(token);
    }

    private mapPoolTokenToGql(poolToken: PrismaPoolTokenWithDynamicData): GqlPoolToken {
        return {
            id: poolToken.id,
            ...poolToken.token,
            __typename: 'GqlPoolToken',
            priceRate: poolToken.dynamicData?.priceRate || '1.0',
            balance: poolToken.dynamicData?.balance || '0',
            index: poolToken.index,
            weight: poolToken.dynamicData?.weight,
        };
    }

    private mapNestedPoolToGqlPoolLinearNested(
        pool: PrismaNestedPoolWithNoNesting,
        percentOfSupplyNested: number,
    ): GqlPoolLinearNested {
        const totalLiquidity = pool.dynamicData?.totalLiquidity || 0;

        return {
            __typename: 'GqlPoolLinearNested',
            ...pool,
            ...pool.linearData!,
            ...pool.linearDynamicData!,
            tokens: pool.tokens
                .filter((token) => token.address !== pool.address)
                .map((token) =>
                    this.mapPoolTokenToGql({
                        ...token,
                        dynamicData: token.dynamicData
                            ? {
                                  ...token.dynamicData,
                                  balance: `${parseFloat(token.dynamicData.balance) * percentOfSupplyNested}`,
                              }
                            : null,
                    }),
                ),
            totalLiquidity: `${totalLiquidity}`,
            totalShares: pool.dynamicData?.totalShares || '0',
        };
    }

    private mapNestedPoolToGqlPoolPhantomStableNested(
        pool: PrismaNestedPoolWithSingleLayerNesting,
        percentOfSupplyNested: number,
    ): GqlPoolPhantomStableNested {
        return {
            __typename: 'GqlPoolPhantomStableNested',
            ...pool,
            nestingType: this.getPoolNestingType(pool),
            tokens: pool.tokens
                .filter((token) => token.address !== pool.address)
                .map((token) => {
                    const nestedPool = token.nestedPool;

                    if (nestedPool && nestedPool.type === 'LINEAR') {
                        const totalShares = parseFloat(nestedPool.dynamicData?.totalShares || '0');
                        const percentOfLinearSupplyNested =
                            totalShares > 0 ? parseFloat(token.dynamicData?.balance || '0') / totalShares : 0;

                        return {
                            ...this.mapPoolTokenToGql({
                                ...token,
                                dynamicData: token.dynamicData
                                    ? {
                                          ...token.dynamicData,
                                          balance: `${parseFloat(token.dynamicData.balance) * percentOfSupplyNested}`,
                                      }
                                    : null,
                            }),
                            __typename: 'GqlPoolTokenLinear',
                            ...this.getLinearPoolTokenData(token, nestedPool),
                            pool: this.mapNestedPoolToGqlPoolLinearNested(
                                nestedPool,
                                percentOfSupplyNested * percentOfLinearSupplyNested,
                            ),
                        };
                    }

                    return this.mapPoolTokenToGql(token);
                }),
            totalLiquidity: `${pool.dynamicData?.totalLiquidity || 0}`,
            totalShares: pool.dynamicData?.totalShares || '0',
        };
    }

    private getPoolNestingType(pool: PrismaNestedPoolWithSingleLayerNesting): GqlPoolNestingType {
        const tokens = pool.tokens.filter((token) => token.address !== pool.address);
        const numTokensWithNestedPool = tokens.filter((token) => !!token.nestedPool).length;

        if (numTokensWithNestedPool === tokens.length) {
            return 'HAS_ONLY_PHANTOM_BPT';
        } else if (numTokensWithNestedPool > 0) {
            return 'HAS_SOME_PHANTOM_BPT';
        }

        return 'NO_NESTING';
    }

    private getLinearPoolTokenData(
        poolToken: PrismaPoolTokenWithDynamicData,
        nestedPool: PrismaNestedPoolWithNoNesting,
    ): {
        mainTokenBalance: string;
        wrappedTokenBalance: string;
        totalMainTokenBalance: string;
    } {
        if (!poolToken.dynamicData || !nestedPool.linearData || !nestedPool.dynamicData) {
            return {
                mainTokenBalance: '0',
                wrappedTokenBalance: '0',
                totalMainTokenBalance: '0',
            };
        }

        const percentOfSupplyInPool =
            parseFloat(poolToken.dynamicData.balance) / parseFloat(nestedPool.dynamicData.totalShares);

        const mainToken = nestedPool.tokens[nestedPool.linearData.mainIndex];
        const wrappedToken = nestedPool.tokens[nestedPool.linearData.wrappedIndex];

        const mainTokenBalance = parseFloat(mainToken.dynamicData?.balance || '0') * percentOfSupplyInPool;
        const wrappedTokenBalance = parseFloat(wrappedToken.dynamicData?.balance || '0') * percentOfSupplyInPool;

        return {
            mainTokenBalance: `${mainTokenBalance}`,
            wrappedTokenBalance: `${wrappedTokenBalance}`,
            totalMainTokenBalance: `${
                mainTokenBalance + wrappedTokenBalance * parseFloat(wrappedToken.dynamicData?.priceRate || '1')
            }`,
        };
    }
}
