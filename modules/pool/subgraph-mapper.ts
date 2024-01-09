import { Chain, PrismaPoolType } from '@prisma/client';
import { BalancerPoolFragment } from '../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { AddressZero } from '@ethersproject/constants';
import * as dataMappers from './pool-data';

export const subgraphToPrismaCreate = (
    pool: BalancerPoolFragment,
    chain: Chain,
    blockNumber: number,
    nestedPools: { id: string; address: string }[],
) => {
    const dbData = subgraphMapper(pool, chain, blockNumber, nestedPools);

    const prismaPoolRecordWithAssociations = {
        data: {
            ...dbData.base,
            data: dbData.data, // DISCUSS: simplify DB schema by migrating from individual tables to a JSON column with types enforced on read. And same with dynamic data.
            tokens: {
                createMany: {
                    data: dbData.tokens,
                },
            },
            dynamicData: {
                create: {
                    id: dbData.base.id,
                    ...dbData.dynamicData,
                },
            },
            linearData:
                dbData.base.type === 'LINEAR'
                    ? {
                          create: {
                              id: dbData.base.id,
                              ...(dbData.data as ReturnType<typeof dataMapper['LINEAR']>),
                          },
                      }
                    : undefined,
            elementData:
                dbData.base.type === 'ELEMENT'
                    ? {
                          create: {
                              id: dbData.base.id,
                              ...(dbData.data as ReturnType<typeof dataMapper['ELEMENT']>),
                          },
                      }
                    : undefined,
            gyroData: ['GYRO', 'GYRO3', 'GYROE'].includes(dbData.base.type)
                ? {
                      create: {
                          id: dbData.base.id,
                          ...(dbData.data as ReturnType<typeof dataMapper['GYRO']>),
                      },
                  }
                : undefined,
            linearDynamicData:
                dbData.base.type === 'LINEAR'
                    ? {
                          create: {
                              id: dbData.base.id,
                              ...(dbData.dynamicTypeData as ReturnType<typeof dynamicMapper['LINEAR']>),
                          },
                      }
                    : undefined,
            stableDynamicData: ['STABLE', 'COMPOSABLE_STABLE', 'META_STABLE'].includes(dbData.base.type)
                ? {
                      create: {
                          id: dbData.base.id,
                          ...(dbData.dynamicTypeData as ReturnType<typeof dynamicMapper['STABLE']>),
                      },
                  }
                : undefined,
        },
    };

    return prismaPoolRecordWithAssociations;
};

export const subgraphToPrismaUpdate = (
    pool: BalancerPoolFragment,
    chain: Chain,
    blockNumber: number,
    nestedPools: { id: string; address: string }[],
) => {
    const dbData = subgraphMapper(pool, chain, blockNumber, nestedPools);
    const { id, ...baseWithoutId } = dbData.base;

    const prismaPoolRecordWithDataAssociations = {
        ...baseWithoutId,
        data: dbData.data, // DISCUSS: simplify DB schema by migrating from individual tables to a JSON column with types enforced on read. And same with dynamic data.
        linearData:
            dbData.base.type === 'LINEAR'
                ? {
                      update: {
                          ...(dbData.data as ReturnType<typeof dataMapper['LINEAR']>),
                      },
                  }
                : undefined,
        elementData:
            dbData.base.type === 'ELEMENT'
                ? {
                      update: {
                          ...(dbData.data as ReturnType<typeof dataMapper['ELEMENT']>),
                      },
                  }
                : undefined,
        gyroData: ['GYRO', 'GYRO3', 'GYROE'].includes(dbData.base.type)
            ? {
                  update: {
                      ...(dbData.data as ReturnType<typeof dataMapper['GYRO']>),
                  },
              }
            : undefined,
        linearDynamicData:
            dbData.base.type === 'LINEAR'
                ? {
                      update: {
                          ...(dbData.dynamicTypeData as ReturnType<typeof dynamicMapper['LINEAR']>),
                      },
                  }
                : undefined,
        stableDynamicData: ['STABLE', 'COMPOSABLE_STABLE', 'META_STABLE'].includes(dbData.base.type)
            ? {
                  update: {
                      ...(dbData.dynamicTypeData as ReturnType<typeof dynamicMapper['STABLE']>),
                  },
              }
            : undefined,
    };

    return prismaPoolRecordWithDataAssociations;
};

const subgraphMapper = (
    pool: BalancerPoolFragment,
    chain: Chain,
    blockNumber: number,
    nestedPools: { id: string; address: string }[],
) => {
    const type = mapSubgraphPoolTypeToPoolType(pool.poolType!);
    const version = mapPoolTypeVersion(type, pool.poolTypeVersion!);

    const base = {
        id: pool.id,
        chain: chain,
        createTime: pool.createTime,
        address: pool.address,
        symbol: pool.symbol || '',
        name: pool.name || '',
        decimals: 18,
        type: type,
        version: version,
        owner: pool.owner || AddressZero,
        factory: pool.factory,
    };

    const dynamicData = {
        blockNumber,
        swapFee: pool.swapFee,
        swapEnabled: pool.swapEnabled,
        totalShares: pool.totalShares,
        totalSharesNum: parseFloat(pool.totalShares),
        totalLiquidity: Math.max(parseFloat(pool.totalLiquidity), 0),
    };

    const data: ReturnType<typeof dataMapper[keyof typeof dataMapper]> | {} = Object.keys(dataMapper).includes(type)
        ? dataMapper[type as keyof typeof dataMapper](pool)
        : {};

    const dynamicTypeData = Object.keys(dynamicMapper).includes(type)
        ? dynamicMapper[type as keyof typeof dynamicMapper](pool, blockNumber)
        : {};

    const tokens =
        pool.tokens?.map((token) => {
            const nestedPool = nestedPools.find((nestedPool) => {
                return nestedPool.address === token.address;
            });

            let priceRateProvider;
            if (pool.priceRateProviders) {
                const data = pool.priceRateProviders.find((provider) => provider.token.address === token.address);
                priceRateProvider = data?.address;
            }

            return {
                id: token.id,
                address: token.address,
                priceRateProvider,
                exemptFromProtocolYieldFee: token.isExemptFromYieldProtocolFee
                    ? token.isExemptFromYieldProtocolFee
                    : false,
                nestedPoolId: nestedPool?.id,
                index: token.index || pool.tokensList.findIndex((address) => address === token.address),
            };
        }) ?? [];

    return {
        base,
        dynamicData,
        tokens,
        data,
        dynamicTypeData,
    };
};

const mapSubgraphPoolTypeToPoolType = (poolType: string): PrismaPoolType => {
    switch (poolType) {
        case 'Weighted':
            return 'WEIGHTED';
        case 'LiquidityBootstrapping':
            return 'LIQUIDITY_BOOTSTRAPPING';
        case 'Stable':
            return 'STABLE';
        case 'MetaStable':
            return 'META_STABLE';
        // for the old phantom stable pool, we add it to the DB as type COMPOSABLE_STABLE with version 0
        case 'StablePhantom':
            return 'COMPOSABLE_STABLE';
        case 'ComposableStable':
            return 'COMPOSABLE_STABLE';
        case 'Linear':
            return 'LINEAR';
        case 'Element':
            return 'ELEMENT';
        case 'Investment':
            return 'INVESTMENT';
        case 'Gyro2':
            return 'GYRO';
        case 'Gyro3':
            return 'GYRO3';
        case 'GyroE':
            return 'GYROE';
        case 'FX':
            return 'FX';
    }

    // balancer still uses AaveLinear, etc, so we account for that here
    if (poolType.includes('Linear')) {
        return 'LINEAR';
    }

    return 'UNKNOWN';
};

const mapPoolTypeVersion = (poolType: string, poolTypeVersion: number): number => {
    // for the old phantom stable pool, we add it to the DB as type COMPOSABLE_STABLE with version 0
    let version = poolTypeVersion ? poolTypeVersion : 1;
    if (poolType === 'StablePhantom') {
        version = 0;
    }

    return version;
};

const dataMapper = {
    ELEMENT: dataMappers.element,
    FX: dataMappers.fx,
    GYRO: dataMappers.gyro,
    GYRO3: dataMappers.gyro,
    GYROE: dataMappers.gyro,
    LINEAR: dataMappers.linear,
};

const dynamicMapper = {
    STABLE: dataMappers.stableDynamic,
    COMPOSABLE_STABLE: dataMappers.stableDynamic,
    META_STABLE: dataMappers.stableDynamic,
    LINEAR: dataMappers.linearDynamic,
};

export type FxData = ReturnType<typeof dataMappers['fx']>;
export type GyroData = ReturnType<typeof dataMappers['gyro']>;
export type LinearData = ReturnType<typeof dataMappers['linear']>;
export type ElementData = ReturnType<typeof dataMappers['element']>;
export type StableDynamicData = ReturnType<typeof dataMappers['stableDynamic']>;
export type LinearDynamicData = ReturnType<typeof dataMappers['linearDynamic']>;
