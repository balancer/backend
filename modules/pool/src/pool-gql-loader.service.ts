import {
    PrismaNestedPoolWithNoNesting,
    PrismaNestedPoolWithSingleLayerNesting,
    PrismaPoolTokenWithDynamicData,
    PrismaPoolTokenWithExpandedNesting,
    prismaPoolWithExpandedNesting,
    PrismaPoolWithExpandedNesting,
} from '../../../prisma/prisma-types';
import {
    GqlPoolInvestConfig,
    GqlPoolInvestOption,
    GqlPoolLinear,
    GqlPoolLinearNested,
    GqlPoolNestingType,
    GqlPoolPhantomStableNested,
    GqlPoolToken,
    GqlPoolTokenUnion,
    GqlPoolUnion,
    GqlPoolWithdrawConfig,
    GqlPoolWithdrawOption,
    QueryPoolGetPoolsArgs,
} from '../../../schema';
import { TokenPriceService } from '../../token-price/token-price.service';
import { isSameAddress } from '@balancer-labs/sdk';
import _ from 'lodash';
import { prisma } from '../../util/prisma-client';
import { networkConfig } from '../../config/network-config';
import { Prisma } from '@prisma/client';
import { env } from '../../../app/env';

export class PoolGqlLoaderService {
    constructor() {}

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

    public async getPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolUnion[]> {
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
        }

        const where = args.where;

        const pools = await prisma.prismaPool.findMany({
            take: args.first || undefined,
            skip: args.skip || undefined,
            orderBy,
            include: prismaPoolWithExpandedNesting.include,
            where: where
                ? {
                      type: {
                          in: where.poolTypeIn || undefined,
                          notIn: where.poolTypeNotIn || undefined,
                      },
                      tokens: {
                          some: {
                              id: {
                                  in: where.tokensIn?.map((token) => token.toLowerCase()) || undefined,
                                  notIn: where.tokensNotIn?.map((token) => token.toLowerCase()) || undefined,
                              },
                          },
                      },
                      id: {
                          in: where.idIn || undefined,
                          notIn: where.idNotIn || undefined,
                      },
                      categories: {
                          some: {
                              category: {
                                  in: where.categoryIn || undefined,
                                  notIn: ['BLACK_LISTED', ...(where.categoryNotIn || [])],
                              },
                          },
                      },
                  }
                : undefined,
        });

        return pools.map((pool) => this.mapPoolToGqlPool(pool));
    }

    private mapPoolToGqlPool(pool: PrismaPoolWithExpandedNesting): GqlPoolUnion {
        const { fees24h, totalLiquidity, volume24h } = pool.dynamicData!;
        const aprItems = pool.aprItems || [];
        const swapAprItems = aprItems.filter((item) => item.isSwapApr);
        const nativeRewardAprItems = aprItems.filter((item) => item.isNativeRewardApr);
        const thirdPartyRewardAprItems = aprItems.filter((item) => item.isThirdPartyApr);

        const mappedData = {
            ...pool,
            dynamicData: {
                ...pool.dynamicData!,
                totalLiquidity: `${totalLiquidity}`,
                fees24h: `${fees24h}`,
                volume24h: `${volume24h}`,
                apr: {
                    total: `${_.sumBy(aprItems, 'apr')}`,
                    swapApr: `${_.sumBy(swapAprItems, 'apr')}`,
                    nativeRewardApr: `${_.sumBy(nativeRewardAprItems, 'apr')}`,
                    thirdPartyApr: `${_.sumBy(thirdPartyRewardAprItems, 'apr')}`,
                    items: aprItems.map((item) => ({
                        ...item,
                        apr: `${item.apr}`,
                        subItems: item.subItems.map((subItem) => ({
                            ...subItem,
                            apr: `${subItem.apr}`,
                        })),
                    })),
                    hasRewardApr: nativeRewardAprItems.length > 0 || thirdPartyRewardAprItems.length > 0,
                },
            },
            investConfig: this.getPoolInvestConfig(pool),
            withdrawConfig: this.getPoolWithdrawConfig(pool),
            nestingType: this.getPoolNestingType(pool),
            tokens: pool.tokens.map((token) => this.mapPoolTokenToGqlUnion(token)),
            allTokens: pool.allTokens.map((token) => ({ ...token.token, chainId: parseInt(env.CHAIN_ID) })),
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
            const isWrappedNativeAsset = isSameAddress(mainToken.address, networkConfig.wethAddress);

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
                                      symbol: networkConfig.ethSymbol,
                                      address: networkConfig.ethAddress,
                                  },
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
            const isWrappedNativeAsset = isSameAddress(poolToken.address, networkConfig.wethAddress);

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
                                      symbol: networkConfig.ethSymbol,
                                      address: networkConfig.ethAddress,
                                  },
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
            return {
                ...this.mapPoolTokenToGql(token),
                __typename: 'GqlPoolTokenLinear',
                ...this.getLinearPoolTokenData(token, nestedPool),
                pool: this.mapNestedPoolToGqlPoolLinearNested(nestedPool),
            };
        } else if (nestedPool && nestedPool.type === 'PHANTOM_STABLE') {
            return {
                ...this.mapPoolTokenToGql(token),
                __typename: 'GqlPoolTokenPhantomStable',
                pool: this.mapNestedPoolToGqlPoolPhantomStableNested(nestedPool),
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
        };
    }

    private mapNestedPoolToGqlPoolLinearNested(pool: PrismaNestedPoolWithNoNesting): GqlPoolLinearNested {
        return {
            __typename: 'GqlPoolLinearNested',
            ...pool,
            ...pool.linearData!,
            ...pool.linearDynamicData!,
            tokens: pool.tokens.map((token) => this.mapPoolTokenToGql(token)),
            totalLiquidity: `${pool.dynamicData?.totalLiquidity || 0}`,
            totalShares: pool.dynamicData?.totalShares || '0',
        };
    }

    private mapNestedPoolToGqlPoolPhantomStableNested(
        pool: PrismaNestedPoolWithSingleLayerNesting,
    ): GqlPoolPhantomStableNested {
        return {
            __typename: 'GqlPoolPhantomStableNested',
            ...pool,
            nestingType: this.getPoolNestingType(pool),
            tokens: pool.tokens.map((token) => {
                const nestedPool = token.nestedPool;

                if (nestedPool && nestedPool.type === 'LINEAR') {
                    return {
                        ...this.mapPoolTokenToGql(token),
                        __typename: 'GqlPoolTokenLinear',
                        ...this.getLinearPoolTokenData(token, nestedPool),
                        pool: this.mapNestedPoolToGqlPoolLinearNested(nestedPool),
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
