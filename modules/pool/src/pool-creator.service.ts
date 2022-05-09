import { balancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { prisma } from '../../util/prisma-client';
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants';
import { PrismaPoolType, PrismaPool } from '@prisma/client';
import { sortBy } from 'lodash';

export class PoolCreatorService {
    public async syncAllPoolsFromSubgraph(blockNumber: number): Promise<string[]> {
        const existingPools = await prisma.prismaPool.findMany();
        const subgraphPools = await balancerSubgraphService.getAllPools({}, false);
        const sortedSubgraphPools = this.sortSubgraphPools(subgraphPools);

        const poolIds: string[] = [];

        for (const subgraphPool of sortedSubgraphPools) {
            const existsInDb = !!existingPools.find((pool) => pool.id === subgraphPool.id);

            if (!existsInDb) {
                await this.createPoolRecord(subgraphPool, sortedSubgraphPools, blockNumber);

                poolIds.push(subgraphPool.id);
            }
        }

        return poolIds;
    }

    public async syncNewPoolsFromSubgraph(blockNumber: number): Promise<string[]> {
        const existingPools = await prisma.prismaPool.findMany();
        const latest = await prisma.prismaPool.findFirst({
            orderBy: { createTime: 'desc' },
            select: { createTime: true },
        });

        const subgraphPools = await balancerSubgraphService.getAllPools(
            {
                where: { createTime_gte: latest?.createTime || 0 },
            },
            false,
        );
        const sortedSubgraphPools = this.sortSubgraphPools(subgraphPools);
        const poolIds = new Set<string>();

        for (const subgraphPool of sortedSubgraphPools) {
            const existsInDb = !!existingPools.find((pool) => pool.id === subgraphPool.id);

            if (!existsInDb) {
                await this.createPoolRecord(subgraphPool, sortedSubgraphPools, blockNumber);

                poolIds.add(subgraphPool.id);
            }
        }

        return Array.from(poolIds);
    }

    private async createPoolRecord(pool: BalancerPoolFragment, allPools: BalancerPoolFragment[], blockNumber: number) {
        const poolType = this.mapSubgraphPoolTypeToPoolType(pool.poolType || '');
        const poolTokens = pool.tokens || [];

        await prisma.prismaPool.create({
            data: {
                id: pool.id,
                createTime: pool.createTime,
                address: pool.address,
                symbol: pool.symbol || '',
                name: pool.name || '',
                type: poolType,
                owner: pool.owner || ZERO_ADDRESS,
                factory: pool.factory,
                tokens: {
                    createMany: {
                        data: poolTokens.map((token, index) => {
                            const nestedPool = allPools.find((nestedPool) => {
                                const poolType = this.mapSubgraphPoolTypeToPoolType(nestedPool.poolType || '');

                                return (
                                    nestedPool.address === token.address &&
                                    (poolType === 'LINEAR' || poolType === 'PHANTOM_STABLE')
                                );
                            });

                            return {
                                id: token.id,
                                decimals: token.decimals,
                                address: token.address,
                                name: token.name,
                                symbol: token.symbol,
                                nestedPoolId: nestedPool?.id,
                                index,
                            };
                        }),
                    },
                },
                linearData:
                    poolType === 'LINEAR'
                        ? {
                              create: {
                                  id: pool.id,
                                  mainIndex: pool.mainIndex || 0,
                                  wrappedIndex: pool.wrappedIndex || 0,
                              },
                          }
                        : undefined,
                linearDynamicData:
                    poolType === 'LINEAR'
                        ? {
                              create: {
                                  id: pool.id,
                                  upperTarget: pool.upperTarget || '',
                                  lowerTarget: pool.lowerTarget || '',
                                  blockNumber,
                              },
                          }
                        : undefined,
                elementData:
                    poolType === 'ELEMENT'
                        ? {
                              create: {
                                  id: pool.id,
                                  unitSeconds: pool.unitSeconds || '',
                                  principalToken: pool.principalToken || '',
                                  baseToken: pool.baseToken || '',
                              },
                          }
                        : undefined,
                stableDynamicData:
                    poolType === 'STABLE' || poolType === 'PHANTOM_STABLE' || poolType === 'META_STABLE'
                        ? {
                              create: {
                                  id: pool.id,
                                  amp: pool.amp || '',
                                  blockNumber,
                              },
                          }
                        : undefined,
                dynamicData: {
                    create: {
                        id: pool.id,
                        blockNumber,
                        swapFee: pool.swapFee,
                        swapEnabled: pool.swapEnabled,
                        totalShares: pool.totalShares,
                        totalLiquidity: Math.max(parseFloat(pool.totalLiquidity), 0),
                        volume24h: 0,
                        fees24h: 0,
                    },
                },
            },
        });

        await prisma.prismaPoolTokenDynamicData.createMany({
            data: poolTokens.map((token) => ({
                id: token.id,
                poolTokenId: token.id,
                blockNumber,
                priceRate: token.priceRate || '1.0',
                weight: token.weight,
                balance: token.balance,
                balanceUSD: 0,
            })),
        });
    }

    private sortSubgraphPools(subgraphPools: BalancerPoolFragment[]) {
        return sortBy(subgraphPools, (pool) => {
            const poolType = this.mapSubgraphPoolTypeToPoolType(pool.poolType || '');

            if (poolType === 'LINEAR') {
                return 0;
            } else if (poolType === 'PHANTOM_STABLE') {
                //if the phantom stable has a nested phantom stable, it needs to appear later in the list
                const nestedPhantomStableToken = (pool.tokens || []).find((token) => {
                    if (token.address === pool.address) {
                        return false;
                    }

                    const nestedPool = subgraphPools.find((nestedPool) => nestedPool.address === token.address);
                    const nestedPoolType = this.mapSubgraphPoolTypeToPoolType(nestedPool?.poolType || '');

                    return nestedPoolType === 'PHANTOM_STABLE';
                });

                return nestedPhantomStableToken ? 2 : 1;
            }

            return 3;
        });
    }

    private mapSubgraphPoolTypeToPoolType(poolType: string): PrismaPoolType {
        switch (poolType) {
            case 'Weighted':
                return 'WEIGHTED';
            case 'LiquidityBootstrapping':
                return 'LIQUIDITY_BOOTSTRAPPING';
            case 'Stable':
                return 'STABLE';
            case 'MetaStable':
                return 'META_STABLE';
            case 'StablePhantom':
                return 'PHANTOM_STABLE';
            case 'Linear':
                return 'LINEAR';
            case 'Element':
                return 'ELEMENT';
            case 'Investment':
                return 'INVESTMENT';
        }

        return 'UNKNOWN';
    }
}
