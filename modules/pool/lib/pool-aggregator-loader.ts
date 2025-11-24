import { Prisma, PrismaErc4626ReviewData, PrismaTokenType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { HookData } from '../../../prisma/prisma-types';
import {
    GqlPoolAggregator,
    QueryAggregatorPoolsArgs,
    LiquidityManagement,
} from '../../../apps/api/gql/generated-schema';
import _ from 'lodash';
import { FxData, GyroData, StableData, QuantAmmWeightedData, ReclammData } from '../subgraph-mapper';
import { mapHookToGqlHook } from '../../sources/transformers';
import { chainToChainId } from '../../network/chain-id-to-chain';

const aggregatorPrismaValidator = Prisma.validator<Prisma.PrismaPoolDefaultArgs>()({
    include: {
        dynamicData: true,
        tokens: {
            include: {
                token: {
                    include: {
                        types: true,
                    },
                },
            },
        },
        // allTokens: true,
    },
});

type AggregatorPrismaSchema = Prisma.PrismaPoolGetPayload<typeof aggregatorPrismaValidator>;

const aggregatorPrismaPoolTokenValidator = Prisma.validator<Prisma.PrismaPoolTokenDefaultArgs>()({
    include: {
        token: {
            include: {
                types: true,
            },
        },
    },
});

type AggregatorPrismaPoolTokenSchema = Prisma.PrismaPoolTokenGetPayload<typeof aggregatorPrismaPoolTokenValidator>;

const tokenWithTypes = Prisma.validator<Prisma.PrismaTokenDefaultArgs>()({
    include: {
        types: true,
    },
});

type TokenWithTypes = Prisma.PrismaTokenGetPayload<typeof tokenWithTypes>;

export class PoolAggregatorLoader {
    public async aggregatorPools(args: QueryAggregatorPoolsArgs): Promise<GqlPoolAggregator[]> {
        const baseQuery: Prisma.PrismaPoolFindManyArgs = {
            take: args.first || undefined,
            skip: args.skip || undefined,
            orderBy: {
                dynamicData: {
                    totalLiquidity: 'desc',
                },
            },
        };

        const where: Prisma.PrismaPoolWhereInput = {
            id: {
                in: args.where?.idIn?.map((id) => id.toLowerCase()) || undefined,
            },
            chain: {
                in: args.where?.chainIn || undefined,
            },
            protocolVersion: {
                in: args.where?.protocolVersionIn || undefined,
            },
            type: {
                in: args.where?.poolTypeIn || undefined,
            },
            dynamicData: {
                swapEnabled: true,
                isPaused: false,
                isInRecoveryMode: false,
                totalSharesNum: {
                    gt: 0.000000000001,
                },
                totalLiquidity: {
                    gt: args.where?.minTvl || undefined,
                },
            },
            NOT: {
                categories: {
                    has: 'BLACK_LISTED',
                },
            },
            ...(args.where?.tokensIn
                ? {
                      AND: args.where.tokensIn.map((token) => ({
                          allTokens: {
                              some: {
                                  token: {
                                      address: {
                                          equals: token.toLowerCase(),
                                      },
                                  },
                              },
                          },
                      })),
                  }
                : {}),
        };

        // Get all the tokens for the chain - most likely scenario is client is fetching the chain information
        console.time('dbTokens');
        const [dbTokens, dbTypes, erc4626ReviewData] = await Promise.all([
            prisma.prismaToken.findMany({
                where: {
                    ...(args.where?.chainIn ? { chain: { in: args.where?.chainIn } } : {}),
                },
            }),
            prisma.prismaTokenType.findMany({
                where: {
                    ...(args.where?.chainIn ? { chain: { in: args.where?.chainIn } } : {}),
                },
            }),
            prisma.prismaErc4626ReviewData.findMany({
                where: {
                    chain: {
                        in: args.where?.chainIn || undefined,
                    },
                },
            }),
        ]);

        const typesMap = dbTypes.reduce((agg, item) => {
            agg[`${item.chain}-${item.tokenAddress}`] ||= [];
            agg[`${item.chain}-${item.tokenAddress}`].push(item);
            return agg;
        }, {} as Record<string, PrismaTokenType[]>);

        const tokensMap = Object.fromEntries(
            dbTokens.map((token) => [
                `${token.chain}-${token.address}`,
                { ...token, types: typesMap[`${token.chain}-${token.address}`] },
            ]),
        );
        console.timeEnd('dbTokens');

        console.time('dbPools');
        const pools = await prisma.prismaPool
            .findMany({
                ...baseQuery,
                where,
                include: {
                    dynamicData: true,
                    tokens: { orderBy: [{ index: 'asc' }] },
                    ...(args.where?.tokensIn
                        ? {
                              allTokens: true,
                          }
                        : {}),
                },
            })
            .then((pools) =>
                pools.map((pool) => ({
                    ...pool,
                    tokens: pool.tokens.map((token) => ({
                        ...token,
                        token: tokensMap[`${token.chain}-${token.address}`],
                    })),
                })),
            );
        // const [dbPools, dbPoolTokens, dbDynamicData] = await Promise.all([
        //     prisma.prismaPool.findMany({
        //         where: poolsWhere,
        //     }),
        //     prisma.prismaPoolToken
        //         .findMany({
        //             where: {
        //                 chain: poolsWhere.chain,
        //             },
        //         })
        //         .then((records) =>
        //             records.map((token) => ({ ...token, token: tokensMap[`${token.chain}-${token.address}`] })),
        //         )
        //         .then((records) =>
        //             records.reduce(
        //                 (acc, token) => {
        //                     const key = `${token.poolId}-${token.chain}`;
        //                     if (!acc[key]) {
        //                         acc[key] = [];
        //                     }
        //                     acc[key].push(token);
        //                     return acc;
        //                 },
        //                 {} as Record<string, AggregatorPrismaPoolTokenSchema[]>,
        //             ),
        //         ),
        //     prisma.prismaPoolDynamicData
        //         .findMany({
        //             where: dynamicDataWhere,
        //         })
        //         .then((records) => Object.fromEntries(records.map((pool) => [`${pool.id}-${pool.chain}`, pool]))),
        // ]);

        // // Merge pools with dynamic data, only including pools that have matching dynamic data
        // const pools = dbPools
        //     .map((pool) => {
        //         const dynamicData = dbDynamicData[`${pool.id}-${pool.chain}`];
        //         const tokens = dbPoolTokens[`${pool.id}-${pool.chain}`];
        //         if (!dynamicData) {
        //             return null;
        //         }
        //         return {
        //             ...pool,
        //             dynamicData,
        //             tokens,
        //         };
        //     })
        //     .filter((pool): pool is NonNullable<typeof pool> => pool !== null);
        console.timeEnd('dbPools');

        // Get review data
        const erc4626ReviewDataMap = Object.fromEntries(erc4626ReviewData.map((data) => [data.erc4626Address, data]));

        console.time('poolsMapping');
        const gqlPools = pools.map((pool) => this.mapPoolToAggregatorPool(pool, tokensMap, erc4626ReviewDataMap));
        const filteredPools = [];

        for (const mappedPool of gqlPools) {
            // if a pool has a hook, we skip it if either there are no included hooks, or its type does not match an included hook
            // we always return reclammns and lbps. They make special use of the hook system but are not real hooks
            if (mappedPool.hook && mappedPool.type !== 'RECLAMM' && mappedPool.type !== 'LIQUIDITY_BOOTSTRAPPING') {
                if (!args.where?.includeHooks || !args.where.includeHooks.includes(mappedPool.hook.type)) {
                    continue;
                }
            }

            // filter out pools that have a rateprovider without or unsafe rateprovider info
            if (
                mappedPool.poolTokens.some(
                    (token) => token.priceRateProvider && token.priceRateProviderData?.summary !== 'safe',
                )
            ) {
                continue;
            }

            filteredPools.push(mappedPool);
        }
        console.timeEnd('poolsMapping');

        return filteredPools;
    }

    private mapPoolToAggregatorPool(
        pool: AggregatorPrismaSchema,
        underlyingMap: Record<string, TokenWithTypes>,
        reviewMap: Record<string, PrismaErc4626ReviewData>,
    ): GqlPoolAggregator {
        const { typeData, ...poolWithoutTypeData } = pool;

        const hook = (pool.hook as HookData)?.address ? (pool.hook as HookData) : null;

        const mappedData = {
            ...poolWithoutTypeData,
            decimals: 18,
            swapFee: pool.dynamicData!.swapFee,
            dynamicData: {
                ...pool.dynamicData,
                apr: {
                    apr: {
                        total: '0',
                    },
                    thirdPartyApr: {
                        total: '0',
                    },
                    nativeRewardApr: {
                        total: '0',
                    },
                    swapApr: '0',
                    hasRewardApr: false,
                    items: [],
                },
                poolId: pool.dynamicData!.poolId,
                aggregateSwapFee: pool.dynamicData!.aggregateSwapFee,
                aggregateYieldFee: pool.dynamicData!.aggregateYieldFee,
                aprItems: [],
                totalSupply: pool.dynamicData!.totalShares,
                isInRecoveryMode: pool.dynamicData!.isInRecoveryMode,
                isPaused: pool.dynamicData!.isPaused,
                swapEnabled: pool.dynamicData!.swapEnabled,
                swapFee: pool.dynamicData!.swapFee,
                totalLiquidity: `${pool.dynamicData!.totalLiquidity}`,
                totalLiquidity24hAgo: `${pool.dynamicData!.totalLiquidity24hAgo}`,
                totalShares: pool.dynamicData!.totalShares,
                totalShares24hAgo: pool.dynamicData!.totalShares24hAgo,
                swapsCount: '0',
                lifetimeSwapFees: '0',
                lifetimeVolume: '0',
                protocolFees24h: '0',
                protocolFees48h: '0',
                surplus24h: '0',
                surplus48h: '0',
                volume24h: '0',
                volume48h: '0',
                yieldCapture24h: '0',
                yieldCapture48h: '0',
                protocolYieldCapture24h: '0',
                protocolYieldCapture48h: '0',
                volume24hAth: '0',
                volume24hAthTimestamp: 0,
                volume24hAtl: '0',
                volume24hAtlTimestamp: 0,
                fees24h: '0',
                fees48h: '0',
                holdersCount: '0',
                fees24hAth: '0',
                fees24hAthTimestamp: 0,
                fees24hAtl: '0',
                fees24hAtlTimestamp: 0,
                sharePriceAth: '0',
                sharePriceAthTimestamp: 0,
                sharePriceAtl: '0',
                sharePriceAtlTimestamp: 0,
                totalLiquidityAth: '0',
                totalLiquidityAthTimestamp: 0,
                totalLiquidityAtl: '0',
                totalLiquidityAtlTimestamp: 0,
            },
            poolTokens: pool.tokens.map((token) => {
                const underlying = token.token.underlyingTokenAddress
                    ? underlyingMap[`${token.chain}-${token.token.underlyingTokenAddress}`]
                    : null;
                const underlyingTypes = underlying?.types?.map((t) => t.type) || [];
                const review = reviewMap[token.address] || {};
                const types = token.token.types?.map((t) => t.type) || [];
                return {
                    address: token.address,
                    name: token.token.name,
                    symbol: token.token.symbol,
                    decimals: token.token.decimals,
                    balance: token.balance,
                    weight: token.weight,
                    isErc4626: token.token.types ? types.includes('ERC4626') : false,
                    balanceUSD: `${token.balanceUSD}`,
                    hasNestedPool: token.token.types ? token.address !== pool.address && types.includes('BPT') : false,
                    index: token.index,
                    id: token.id,
                    isAllowed: types.includes('BLOCKED_V2') || types.includes('BLOCKED_V3'),
                    isBufferAllowed: token.token.isBufferAllowed,
                    isExemptFromProtocolYieldFee: token.exemptFromProtocolYieldFee,
                    canUseBufferForSwaps: review.canUseBufferForSwaps,
                    useUnderlyingForAddRemove: review.useUnderlyingForAddRemove,
                    useWrappedForAddRemove: review.useWrappedForAddRemove,
                    priceRate: token.priceRate,
                    priceRateProvider: token.priceRateProvider,
                    maxDeposit: token.token.maxDeposit === '0' ? undefined : token.token.maxDeposit,
                    maxWithdraw: token.token.maxWithdraw === '0' ? undefined : token.token.maxWithdraw,
                    scalingFactor: token.scalingFactor,
                    underlyingToken: underlying
                        ? {
                              address: underlying.address,
                              symbol: underlying.symbol,
                              name: underlying.name,
                              decimals: underlying.decimals,
                              isBufferAllowed: underlying.isBufferAllowed,
                              chain: underlying.chain,
                              chainId: Number(chainToChainId[underlying.chain]),
                              isErc4626: underlyingTypes?.includes('ERC4626') || false,
                              tradable:
                                  underlyingTypes?.includes('BPT') || underlyingTypes?.includes('PHANTOM_BPT') || false,
                              priority: 0,
                          }
                        : undefined,
                };
            }),
            protocolVersion: pool.protocolVersion,
            liquidityManagement: (pool.liquidityManagement as LiquidityManagement) || undefined,
            hook: hook ? mapHookToGqlHook(hook) : undefined,
        };

        switch (pool.type) {
            case 'STABLE':
            case 'META_STABLE':
            case 'COMPOSABLE_STABLE':
                return {
                    ...mappedData,
                    amp: (typeData as StableData).amp,
                };
            case 'GYRO':
            case 'GYRO3':
            case 'GYROE':
                return {
                    ...mappedData,
                    ...(typeData as GyroData), // Deprecated
                };
            case 'FX':
                return {
                    ...mappedData,
                    ...(typeData as FxData), // Deprecated
                };
            case 'QUANT_AMM_WEIGHTED':
                return {
                    ...mappedData,
                    quantAmmWeightedParams: typeData as QuantAmmWeightedData,
                };
            case 'RECLAMM':
                return {
                    ...mappedData,
                    ...(typeData as ReclammData), // Deprecated
                };
            case 'ELEMENT':
                return {
                    ...mappedData,
                };
            case 'LIQUIDITY_BOOTSTRAPPING':
                return {
                    ...mappedData,
                };
        }

        return {
            ...poolWithoutTypeData,
            ...mappedData,
        };
    }
}
