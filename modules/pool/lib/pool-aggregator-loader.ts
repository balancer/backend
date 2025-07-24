import {
    PrismaPoolMinimal,
    prismaPoolWithExpandedNesting,
    PrismaPoolWithExpandedNesting,
    HookData,
} from '../../../prisma/prisma-types';
import {
    GqlPoolDynamicData,
    GqlPoolMinimal,
    GqlPoolUnion,
    QueryPoolGetPoolsArgs,
    GqlPoolAggregator,
    LiquidityManagement,
    QueryAggregatorPoolsArgs,
} from '../../../apps/api/gql/generated-schema';
import _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { Prisma } from '@prisma/client';
import { fixedNumber } from '../../view-helpers/fixed-number';
import { ElementData, FxData, GyroData, StableData, QuantAmmWeightedData, ReclammData } from '../subgraph-mapper';
import { ZERO_ADDRESS } from '@balancer/sdk';
import { mapHookToGqlHook } from '../../sources/transformers';
import { mapPoolToken, enrichWithErc4626Data, mapAprItems } from './pool-gql-mapper-helper';

export class PoolAggregatorLoader {
    public async aggregatorPools(args: QueryAggregatorPoolsArgs): Promise<GqlPoolAggregator[]> {
        // add limits per default
        args.first = args.first || 1000;
        args.skip = args.skip || 0;

        const orderBy = getOrderBy(args);

        const baseQuery: Prisma.PrismaPoolFindManyArgs = {
            take: args.first || undefined,
            skip: args.skip || undefined,
            orderBy,
        };

        const where = args.where || {};

        const allTokensFilter = [];
        where?.tokensIn?.forEach((token) => {
            allTokensFilter.push({
                allTokens: {
                    some: {
                        token: {
                            address: {
                                equals: token.toLowerCase(),
                            },
                        },
                    },
                },
            });
        });

        if (where?.tokensNotIn) {
            allTokensFilter.push({
                allTokens: {
                    every: {
                        token: {
                            address: {
                                notIn: where.tokensNotIn.map((t) => t.toLowerCase()) || undefined,
                            },
                        },
                    },
                },
            });
        }

        const filterArgs: Prisma.PrismaPoolWhereInput = {
            dynamicData: {
                swapEnabled: true,
                isPaused: false,
                isInRecoveryMode: false,
                totalSharesNum: {
                    gt: 0.000000000001,
                },
                totalLiquidity: {
                    gt: where?.minTvl || undefined,
                },
            },
            chain: {
                in: where?.chainIn || undefined,
                notIn: where?.chainNotIn || undefined,
            },
            protocolVersion: {
                in: where?.protocolVersionIn || undefined,
            },
            type: {
                in: where?.poolTypeIn || undefined,
                notIn: where?.poolTypeNotIn || undefined,
            },
            createTime: {
                gt: where?.createTime?.gt || undefined,
                lt: where?.createTime?.lt || undefined,
            },
            NOT: {
                categories: {
                    has: 'BLACK_LISTED',
                },
            },
            AND: allTokensFilter,
            id: {
                in: where?.idIn?.map((id) => id.toLowerCase()) || undefined,
                notIn: where?.idNotIn?.map((id) => id.toLowerCase()) || undefined,
            },
        };

        const query = {
            ...baseQuery,
            where: {
                ...filterArgs,
                allTokens: {
                    some: {
                        token: {
                            address: filterArgs.allTokens?.some?.token?.address,
                        },
                    },
                },
            },
        };

        const pools = await prisma.prismaPool.findMany({
            ...query,
            include: {
                ...this.getPoolInclude(),
            },
        });

        const gqlPools = pools.map((pool) => this.mapPoolToAggregatorPool(pool));
        const filteredPools = [];

        for (const mappedPool of gqlPools) {
            // if a pool has a hook, we skip it if either there are no included hooks, or its type does not match an included hook
            if (mappedPool.hook) {
                if (!args.where?.includeHooks || !args.where.includeHooks.includes(mappedPool.hook.type)) {
                    continue;
                }
            }

            // load rate provider data into PoolTokenDetail model
            await this.enrichWithRateproviderData(mappedPool);

            // load underlying token info into PoolTokenDetail
            await enrichWithErc4626Data(mappedPool.poolTokens, mappedPool.chain);

            filteredPools.push(mappedPool);
        }

        return filteredPools;
    }

    private async enrichWithRateproviderData(mappedPool: GqlPoolMinimal | GqlPoolAggregator | GqlPoolUnion) {
        for (const token of mappedPool.poolTokens) {
            if (token.priceRateProvider && token.priceRateProvider !== ZERO_ADDRESS) {
                const rateproviderData = await prisma.prismaPriceRateProviderData.findUnique({
                    where: {
                        chain_rateProviderAddress: {
                            chain: mappedPool.chain,
                            rateProviderAddress: token.priceRateProvider,
                        },
                    },
                });
                if (rateproviderData) {
                    token.priceRateProviderData = {
                        ...rateproviderData,
                        warnings: rateproviderData.warnings?.split(',') || [],
                        upgradeableComponents:
                            (rateproviderData.upgradableComponents as {
                                implementationReviewed: string;
                                entryPoint: string;
                            }[]) || [],
                        address: rateproviderData.rateProviderAddress,
                        reviewFile: rateproviderData.reviewUrl,
                    };
                }
            }
            if (token.hasNestedPool) {
                for (const nestedToken of token.nestedPool!.tokens) {
                    if (nestedToken.priceRateProvider && nestedToken.priceRateProvider !== ZERO_ADDRESS) {
                        const rateproviderData = await prisma.prismaPriceRateProviderData.findUnique({
                            where: {
                                chain_rateProviderAddress: {
                                    chain: mappedPool.chain,
                                    rateProviderAddress: nestedToken.priceRateProvider,
                                },
                            },
                        });
                        if (rateproviderData) {
                            nestedToken.priceRateProviderData = {
                                ...rateproviderData,
                                warnings: rateproviderData.warnings?.split(',') || [],
                                upgradeableComponents:
                                    (rateproviderData.upgradableComponents as {
                                        implementationReviewed: string;
                                        entryPoint: string;
                                    }[]) || [],
                                address: rateproviderData.rateProviderAddress,
                            };
                        }
                    }
                }
            }
        }
    }

    private mapPoolToAggregatorPool(pool: PrismaPoolWithExpandedNesting): GqlPoolAggregator {
        const { typeData, ...poolWithoutTypeData } = pool;

        const hook = (pool.hook as HookData)?.address ? (pool.hook as HookData) : null;

        const mappedData = {
            decimals: 18,
            dynamicData: this.getPoolDynamicData(pool),
            poolTokens: pool.tokens.map((token) => mapPoolToken(token, pool.protocolVersion)),
            vaultVersion: poolWithoutTypeData.protocolVersion,
            liquidityManagement: (pool.liquidityManagement as LiquidityManagement) || undefined,
            hook: mapHookToGqlHook(hook as HookData),
        };

        switch (pool.type) {
            case 'STABLE':
                return {
                    ...poolWithoutTypeData,
                    ...(typeData as StableData),
                    ...mappedData,
                };
            case 'META_STABLE':
                return {
                    ...poolWithoutTypeData,
                    ...(typeData as StableData),
                    ...mappedData,
                };
            case 'COMPOSABLE_STABLE':
                return {
                    ...poolWithoutTypeData,
                    ...(typeData as StableData),
                    ...mappedData,
                    // bptPriceRate: bpt?.priceRate || '1.0',
                };
            case 'ELEMENT':
                return {
                    ...poolWithoutTypeData,
                    ...(typeData as ElementData),
                    ...mappedData,
                };
            case 'LIQUIDITY_BOOTSTRAPPING':
                return {
                    ...poolWithoutTypeData,
                    ...mappedData,
                };
            case 'GYRO':
            case 'GYRO3':
            case 'GYROE':
                return {
                    ...poolWithoutTypeData,
                    ...(typeData as GyroData),
                    ...mappedData,
                };
            case 'FX':
                return {
                    ...poolWithoutTypeData,
                    ...mappedData,
                    ...(typeData as FxData),
                };
            case 'QUANT_AMM_WEIGHTED':
                return {
                    ...poolWithoutTypeData,
                    ...mappedData,
                    quantAmmWeightedParams: typeData as QuantAmmWeightedData,
                };
            case 'RECLAMM':
                return {
                    ...poolWithoutTypeData,
                    ...(typeData as ReclammData),
                    ...mappedData,
                };
        }

        return {
            ...poolWithoutTypeData,
            ...mappedData,
        };
    }

    private getPoolDynamicData(pool: PrismaPoolMinimal): GqlPoolDynamicData {
        const {
            fees24h,
            totalLiquidity,
            volume24h,
            surplus24h,
            fees48h,
            volume48h,
            surplus48h,
            yieldCapture24h,
            yieldCapture48h,
            totalLiquidity24hAgo,
            totalShares24hAgo,
            lifetimeVolume,
            lifetimeSwapFees,
            holdersCount,
            swapsCount,
            protocolFees24h,
            protocolFees48h,
            protocolYieldCapture24h,
            protocolYieldCapture48h,
        } = pool.dynamicData!;

        const newAprItemsSchema = mapAprItems(pool);
        return {
            ...pool.dynamicData!,
            totalLiquidity: `${fixedNumber(totalLiquidity, 2)}`,
            totalLiquidity24hAgo: `${fixedNumber(totalLiquidity24hAgo, 2)}`,
            totalShares24hAgo,
            totalSupply: pool.dynamicData?.totalShares || '0',
            fees24h: `${fixedNumber(fees24h, 2)}`,
            volume24h: `${fixedNumber(volume24h, 2)}`,
            surplus24h: `${fixedNumber(surplus24h, 2)}`,
            surplus48h: `${fixedNumber(surplus48h, 2)}`,
            yieldCapture24h: `${fixedNumber(yieldCapture24h, 2)}`,
            yieldCapture48h: `${fixedNumber(yieldCapture48h, 2)}`,
            fees48h: `${fixedNumber(fees48h, 2)}`,
            volume48h: `${fixedNumber(volume48h, 2)}`,
            lifetimeVolume: `${fixedNumber(lifetimeVolume, 2)}`,
            lifetimeSwapFees: `${fixedNumber(lifetimeSwapFees, 2)}`,
            holdersCount: `${holdersCount}`,
            swapsCount: `${swapsCount}`,
            sharePriceAth: '0',
            sharePriceAtl: '0',
            totalLiquidityAth: '0',
            totalLiquidityAtl: '0',
            volume24hAtl: '0',
            volume24hAth: '0',
            fees24hAtl: '0',
            fees24hAth: '0',
            sharePriceAthTimestamp: 0,
            sharePriceAtlTimestamp: 0,
            totalLiquidityAthTimestamp: 0,
            totalLiquidityAtlTimestamp: 0,
            fees24hAthTimestamp: 0,
            fees24hAtlTimestamp: 0,
            volume24hAthTimestamp: 0,
            volume24hAtlTimestamp: 0,
            protocolYieldCapture24h: `${fixedNumber(protocolYieldCapture24h || 0, 2)}`,
            protocolYieldCapture48h: `${fixedNumber(protocolYieldCapture48h || 0, 2)}`,
            protocolFees24h: `${fixedNumber(protocolFees24h || 0, 2)}`,
            protocolFees48h: `${fixedNumber(protocolFees48h || 0, 2)}`,
            aprItems: newAprItemsSchema,
            apr: {
                apr: { __typename: 'GqlPoolAprTotal', total: '0' },
                swapApr: '0',
                nativeRewardApr: { __typename: 'GqlPoolAprTotal', total: '0' },
                thirdPartyApr: { __typename: 'GqlPoolAprTotal', total: '0' },
                items: [],
                hasRewardApr: false,
            },
        };
    }

    private getPoolInclude(userAddress?: string) {
        return {
            ...prismaPoolWithExpandedNesting.include,
            userWalletBalances: false,
        };
    }
}

const orderingColumnsMap = {
    totalLiquidity: 'totalLiquidity',
    totalShares: 'totalSharesNum',
    volume24h: 'volume24h',
    fees24h: 'fees24h',
    apr: 'apr',
};

const getOrderBy = (args: QueryPoolGetPoolsArgs) => {
    const orderDirection = args.orderDirection || 'desc';
    const orderColumn = orderingColumnsMap[(args.orderBy || 'totalLiquidity') as keyof typeof orderingColumnsMap];

    if (!orderColumn) {
        return undefined;
    }

    const orderBy = {
        dynamicData: {
            [orderColumn]: orderDirection,
        },
    };

    return orderBy;
};
