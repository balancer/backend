import { Prisma, PrismaToken } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { HookData } from '../../../prisma/prisma-types';
import {
    GqlAggregatorPool,
    QueryAggregatorPoolsArgs,
    LiquidityManagement,
    GqlAggregatorReclammParams,
} from '../../../apps/api/gql/generated-schema';
import _ from 'lodash';
import { ElementData, FxData, GyroData, StableData, QuantAmmWeightedData, ReclammData } from '../subgraph-mapper';
import { mapHookToGqlHook } from '../../sources/transformers';

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
        allTokens: true,
    },
});

type AggregatorPrismaSchema = Prisma.PrismaPoolGetPayload<typeof aggregatorPrismaValidator>;

export class PoolAggregatorLoader {
    public async aggregatorPools(args: QueryAggregatorPoolsArgs): Promise<GqlAggregatorPool[]> {
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

        const pools = await prisma.prismaPool.findMany({
            where,
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
                ...(args.where?.tokensIn
                    ? {
                          allTokens: true,
                      }
                    : {}),
            },
        });

        // Get underlying tokens
        const underlyingAddresses = pools
            .flatMap((pool) => pool.tokens.flatMap((token) => token.token.underlyingTokenAddress))
            .filter((address): address is string => !!address);

        const underlyingTokens = await prisma.prismaToken.findMany({
            where: {
                address: {
                    in: underlyingAddresses,
                },
            },
        });

        const underlyingTokensMap = Object.fromEntries(underlyingTokens.map((token) => [token.address, token]));

        const gqlPools = pools.map((pool) => this.mapPoolToAggregatorPool(pool, underlyingTokensMap));
        const filteredPools = [];

        for (const mappedPool of gqlPools) {
            // if a pool has a hook, we skip it if either there are no included hooks, or its type does not match an included hook
            if (mappedPool.hook) {
                if (!args.where?.includeHooks || !args.where.includeHooks.includes(mappedPool.hook.type)) {
                    continue;
                }
            }

            filteredPools.push(mappedPool);
        }

        return filteredPools;
    }

    private mapPoolToAggregatorPool(
        pool: AggregatorPrismaSchema,
        underlyingMap: Record<string, PrismaToken>,
    ): GqlAggregatorPool {
        const { typeData, ...poolWithoutTypeData } = pool;

        const hook = (pool.hook as HookData)?.address ? (pool.hook as HookData) : null;

        const mappedData = {
            ...poolWithoutTypeData,
            decimals: 18,
            swapFee: pool.dynamicData!.swapFee,
            dynamicData: {
                swapFee: pool.dynamicData!.swapFee,
            },
            poolTokens: pool.tokens.map((token) => {
                const underlying = token.token.underlyingTokenAddress
                    ? underlyingMap[token.token.underlyingTokenAddress]
                    : null;
                return {
                    address: token.address,
                    name: token.token.name,
                    symbol: token.token.symbol,
                    decimals: token.token.decimals,
                    balance: token.balance,
                    weight: token.weight,
                    isErc4626: token.token.types ? token.token.types.some((type) => type.type === 'ERC4626') : false,
                    priceRate: token.priceRate,
                    priceRateProvider: token.priceRateProvider,
                    underlyingToken: underlying
                        ? {
                              address: underlying.address,
                              symbol: underlying.symbol,
                              name: underlying.name,
                              decimals: underlying.decimals,
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
                    gyroParams: typeData as GyroData,
                };
            case 'FX':
                return {
                    ...mappedData,
                    ...(typeData as FxData), // Deprecated
                    fxParams: typeData as FxData,
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
                    reclammParams: typeData as GqlAggregatorReclammParams,
                };
            case 'ELEMENT':
                return {
                    ...mappedData,
                    elementParams: typeData as ElementData,
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
