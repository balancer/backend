import {
    PrismaPoolMinimal,
    prismaPoolWithExpandedNesting,
    PrismaPoolWithExpandedNesting,
    HookData,
} from '../../../prisma/prisma-types';
import {
    GqlBalancePoolAprItem,
    GqlBalancePoolAprSubItem,
    GqlPoolDynamicData,
    GqlPoolMinimal,
    GqlPoolUnion,
    QueryPoolGetPoolsArgs,
    GqlPoolAprItem,
    GqlPoolAprItemType,
    GqlPoolAggregator,
    LiquidityManagement,
    QueryAggregatorPoolsArgs,
} from '../../../apps/api/gql/generated-schema';
import _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { Prisma, PrismaPoolAprType } from '@prisma/client';
import { fixedNumber } from '../../view-helpers/fixed-number';
import { ElementData, FxData, GyroData, StableData, QuantAmmWeightedData, ReclammData } from '../subgraph-mapper';
import { ZERO_ADDRESS } from '@balancer/sdk';
import { mapHookToGqlHook } from '../../sources/transformers';
import { mapPoolToken, enrichWithErc4626Data } from './pool-gql-mapper-helper';

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
            poolTokens: pool.tokens.map((token) => mapPoolToken(token)),
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

        const newAprItemsSchema = this.buildAprItems(pool);

        const allAprItems = pool.aprItems?.filter((item) => item.apr > 0 || (item.range?.max ?? 0 > 0)) || [];
        const aprItems = allAprItems.filter(
            (item) => item.type !== 'SWAP_FEE' && item.type !== 'SWAP_FEE_7D' && item.type !== 'SWAP_FEE_30D',
        );
        const swapAprItems = aprItems.filter((item) => item.type === 'SWAP_FEE_24H');

        // swap apr cannot have a range, so we can already sum it up
        const aprItemsWithNoGroup = aprItems.filter((item) => !item.group);

        const hasAprRange = !!aprItems.find((item) => item.range);
        let aprTotal = `${pool.dynamicData?.apr || 0}`;
        let swapAprTotal = `0`;
        let nativeRewardAprTotal = `0`;
        let thirdPartyAprTotal = `0`;

        let aprRangeMin: string | undefined;
        let aprRangeMax: string | undefined;

        let nativeAprRangeMin: string | undefined;
        let nativeAprRangeMax: string | undefined;

        let thirdPartyAprRangeMin: string | undefined;
        let thirdPartyAprRangeMax: string | undefined;

        let hasRewardApr = false;

        // It is likely that if either native or third party APR has a range, that both of them have a range
        // therefore if there is a least one item with a range, we show both rewards in a range, although min and max might be identical
        if (hasAprRange) {
            let swapFeeApr = 0;
            let currentAprRangeMinTotal = 0;
            let currentAprRangeMaxTotal = 0;
            let currentNativeAprRangeMin = 0;
            let currentNativeAprRangeMax = 0;
            let currentThirdPartyAprRangeMin = 0;
            let currentThirdPartyAprRangeMax = 0;

            for (let aprItem of aprItems) {
                let minApr: number;
                let maxApr: number;

                if (aprItem.range) {
                    minApr = aprItem.range.min;
                    maxApr = aprItem.range.max;
                } else {
                    minApr = aprItem.apr;
                    maxApr = aprItem.apr;
                }

                currentAprRangeMinTotal += minApr;
                currentAprRangeMaxTotal += maxApr;

                switch (aprItem.type) {
                    case PrismaPoolAprType.NATIVE_REWARD: {
                        currentNativeAprRangeMin += minApr;
                        currentNativeAprRangeMax += maxApr;
                        break;
                    }
                    case PrismaPoolAprType.THIRD_PARTY_REWARD: {
                        currentThirdPartyAprRangeMin += minApr;
                        currentThirdPartyAprRangeMax += maxApr;
                        break;
                    }
                    case PrismaPoolAprType.VOTING: {
                        currentThirdPartyAprRangeMin += minApr;
                        currentThirdPartyAprRangeMax += maxApr;
                        break;
                    }
                    case 'SWAP_FEE_24H': {
                        swapFeeApr += maxApr;
                        break;
                    }
                }
            }
            swapAprTotal = `${swapFeeApr}`;
            aprRangeMin = `${currentAprRangeMinTotal}`;
            aprRangeMax = `${currentAprRangeMaxTotal}`;
            nativeAprRangeMin = `${currentNativeAprRangeMin}`;
            nativeAprRangeMax = `${currentNativeAprRangeMax}`;
            thirdPartyAprRangeMin = `${currentThirdPartyAprRangeMin}`;
            thirdPartyAprRangeMax = `${currentThirdPartyAprRangeMax}`;
            hasRewardApr = currentNativeAprRangeMax > 0 || currentThirdPartyAprRangeMax > 0;
        } else {
            const nativeRewardAprItems = aprItems.filter((item) => item.type === 'NATIVE_REWARD');
            const thirdPartyRewardAprItems = aprItems.filter((item) => item.type === 'THIRD_PARTY_REWARD');
            swapAprTotal = `${_.sumBy(swapAprItems, 'apr')}`;
            nativeRewardAprTotal = `${_.sumBy(nativeRewardAprItems, 'apr')}`;
            thirdPartyAprTotal = `${_.sumBy(thirdPartyRewardAprItems, 'apr')}`;
            hasRewardApr = nativeRewardAprItems.length > 0 || thirdPartyRewardAprItems.length > 0;
        }

        const grouped = _.groupBy(
            aprItems.filter((item) => item.group),
            (item) => item.group,
        );

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
                apr:
                    typeof aprRangeMin !== 'undefined' && typeof aprRangeMax !== 'undefined'
                        ? {
                              __typename: 'GqlPoolAprRange',
                              min: aprRangeMin,
                              max: aprRangeMax,
                          }
                        : { __typename: 'GqlPoolAprTotal', total: aprTotal },
                swapApr: swapAprTotal,
                nativeRewardApr:
                    typeof nativeAprRangeMin !== 'undefined' && typeof nativeAprRangeMax !== 'undefined'
                        ? {
                              __typename: 'GqlPoolAprRange',
                              min: nativeAprRangeMin,
                              max: nativeAprRangeMax,
                          }
                        : { __typename: 'GqlPoolAprTotal', total: nativeRewardAprTotal },
                thirdPartyApr:
                    typeof thirdPartyAprRangeMin !== 'undefined' && typeof thirdPartyAprRangeMax !== 'undefined'
                        ? {
                              __typename: 'GqlPoolAprRange',
                              min: thirdPartyAprRangeMin,
                              max: thirdPartyAprRangeMax,
                          }
                        : { __typename: 'GqlPoolAprTotal', total: thirdPartyAprTotal },
                items: [
                    ...aprItemsWithNoGroup.flatMap((item): GqlBalancePoolAprItem[] => {
                        if (item.range) {
                            return [
                                {
                                    id: item.id,
                                    apr: {
                                        __typename: 'GqlPoolAprRange',
                                        min: item.range.min.toString(),
                                        max: item.range.max.toString(),
                                    },
                                    title: item.title,
                                    subItems: [],
                                },
                            ];
                        } else {
                            return [
                                {
                                    ...item,
                                    apr: { __typename: 'GqlPoolAprTotal', total: `${item.apr}` },
                                    subItems: [],
                                },
                            ];
                        }
                    }),
                    ..._.map(grouped, (items, group): GqlBalancePoolAprItem => {
                        // todo: might need to support apr ranges as well at some point
                        const subItems = items.map(
                            (item): GqlBalancePoolAprSubItem => ({
                                ...item,
                                apr: { __typename: 'GqlPoolAprTotal', total: `${item.apr}` },
                            }),
                        );
                        let apr = 0;
                        for (const item of items) {
                            if (
                                item.type === 'SWAP_FEE' ||
                                item.type === 'SWAP_FEE_7D' ||
                                item.type === 'SWAP_FEE_30D' ||
                                item.type === 'SURPLUS_24H' ||
                                item.type === 'SURPLUS_7D' ||
                                item.type === 'SURPLUS_30D'
                            ) {
                            } else {
                                apr += item.apr;
                            }
                        }
                        const title = `${group.charAt(0) + group.slice(1).toLowerCase()} boosted APR`;

                        return {
                            id: `${pool.id}-${group}`,
                            title,
                            apr: { __typename: 'GqlPoolAprTotal', total: `${apr}` },
                            subItems,
                        };
                    }),
                ],
                hasRewardApr,
            },
        };
    }

    private buildAprItems(pool: PrismaPoolMinimal): GqlPoolAprItem[] {
        const aprItems: GqlPoolAprItem[] = [];

        for (const aprItem of pool.aprItems) {
            // Skipping SWAP_FEE as the DB state is not updated, safe to remove after deployment of the patch, because all instances of SWAP_FEE_24H will be replaced with SWAP_FEE should be removed from the DB already
            if (aprItem.type === 'SWAP_FEE') {
                continue;
            }

            // Skip 7D, 30D swap APRs - they aren't updated anymore, because noone was using them
            if (['SWAP_FEE_7D', 'SWAP_FEE_30D'].includes(String(aprItem.type))) {
                continue;
            }

            if (aprItem.apr === 0 || (aprItem.range && aprItem.range.max === 0)) {
                continue;
            }

            let type: GqlPoolAprItemType;
            switch (aprItem.type) {
                case PrismaPoolAprType.NATIVE_REWARD:
                    if (pool.chain === 'FANTOM' || pool.chain === 'SONIC') {
                        type = 'MABEETS_EMISSIONS';
                    } else {
                        type = 'VEBAL_EMISSIONS';
                    }
                    break;
                case PrismaPoolAprType.THIRD_PARTY_REWARD:
                    type = 'STAKING';
                    break;
                case null:
                    type = 'NESTED';
                    break;
                default:
                    type = aprItem.type;
                    break;
            }

            if (aprItem.range) {
                aprItems.push({
                    id: aprItem.id,
                    title: aprItem.title,
                    apr: aprItem.range.min,
                    type: type,
                    rewardTokenAddress: aprItem.rewardTokenAddress,
                    rewardTokenSymbol: aprItem.rewardTokenSymbol,
                });
                aprItems.push({
                    id: `${aprItem.id}-boost`,
                    title: aprItem.title,
                    apr: aprItem.range.max - aprItem.range.min,
                    type: 'STAKING_BOOST',
                    rewardTokenAddress: aprItem.rewardTokenAddress,
                    rewardTokenSymbol: aprItem.rewardTokenSymbol,
                });
            } else {
                aprItems.push({
                    id: aprItem.id,
                    title: aprItem.title,
                    apr: aprItem.apr,
                    type: type,
                    rewardTokenAddress: aprItem.rewardTokenAddress,
                    rewardTokenSymbol: aprItem.rewardTokenSymbol,
                });
            }

            // Adding deprecated SWAP_FEE for backwards compatibility
            if (aprItem.type === 'SWAP_FEE_24H') {
                aprItems.push({
                    ...aprItem,
                    id: `${aprItem.id.replace('-24h', '')}`,
                    title: aprItem.title.replace(' (24h)', ''),
                    type: 'SWAP_FEE',
                });
            }
        }

        let filteredItems = aprItems;
        if (pool.type === 'QUANT_AMM_WEIGHTED') {
            filteredItems = aprItems.filter((item) => item.type !== 'QUANT_AMM_UPLIFT');
        }

        return filteredItems;
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
