import { balancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { prisma } from '../../../prisma/prisma-client';
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants';
import { PrismaPoolType } from '@prisma/client';
import _ from 'lodash';
import { prismaPoolWithExpandedNesting } from '../../../prisma/prisma-types';
import { UserService } from '../../user/user.service';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

export class PoolCreatorService {
    constructor(private readonly userService: UserService) {}

    public async syncAllPoolsFromSubgraph(blockNumber: number): Promise<string[]> {
        const existingPools = await prisma.prismaPool.findMany({});
        const subgraphPools = await balancerSubgraphService.getAllPools({}, false);
        const sortedSubgraphPools = this.sortSubgraphPools(subgraphPools);

        const poolIds: string[] = [];

        let counter = 1;
        for (const subgraphPool of sortedSubgraphPools) {
            console.log(`Syncing pool ${counter} of ${sortedSubgraphPools.length}`);
            counter = counter + 1;
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

    public async reloadPoolNestedTokens(poolId: string): Promise<void> {
        const subgraphPools = await balancerSubgraphService.getAllPools({}, false);
        const poolToLoad = subgraphPools.find((pool) => pool.id === poolId);

        if (!poolToLoad) {
            throw new Error('Pool with id does not exist');
        }

        const poolTokens = poolToLoad.tokens || [];

        for (let i = 0; i < poolTokens.length; i++) {
            const token = poolTokens[i];

            if (token.address === poolToLoad.address) {
                continue;
            }

            const nestedPool = subgraphPools.find((nestedPool) => {
                const poolType = this.mapSubgraphPoolTypeToPoolType(nestedPool.poolType || '');

                return nestedPool.address === token.address && (poolType === 'LINEAR' || poolType === 'PHANTOM_STABLE');
            });

            if (nestedPool) {
                await prisma.prismaPoolToken.update({
                    where: { id: token.id },
                    data: { nestedPoolId: nestedPool.id },
                });
            }
        }

        await this.createAllTokensRelationshipForPool(poolId);
    }

    public async reloadAllTokenNestedPoolIds(): Promise<void> {
        let operations: any[] = [];
        const pools = await prisma.prismaPool.findMany({ ...prismaPoolWithExpandedNesting });

        //clear any existing
        await prisma.prismaPoolExpandedTokens.updateMany({
            where: {},
            data: { nestedPoolId: null },
        });

        for (const pool of pools) {
            const nestedTokens = _.flattenDeep(
                pool.tokens
                    .filter((token) => token.address !== pool.address)
                    .map((token) => [
                        ...(token.nestedPool?.tokens || []).map((nestedToken) => ({
                            ...nestedToken,
                            nestedPoolId: token.nestedPool?.id,
                        })),
                        ...(token.nestedPool?.tokens.map((nestedToken) =>
                            (nestedToken.nestedPool?.tokens || []).map((doubleNestedToken) => ({
                                ...doubleNestedToken,
                                nestedPoolId: nestedToken.nestedPool?.id,
                            })),
                        ) || []),
                    ]),
            );

            operations = [
                ...operations,
                ...nestedTokens.map((token) =>
                    prisma.prismaPoolExpandedTokens.update({
                        where: { tokenAddress_poolId: { tokenAddress: token.address, poolId: pool.id } },
                        data: { nestedPoolId: token.nestedPoolId },
                    }),
                ),
            ];
        }

        await prismaBulkExecuteOperations(operations);
    }

    private async createPoolRecord(pool: BalancerPoolFragment, allPools: BalancerPoolFragment[], blockNumber: number) {
        const poolType = this.mapSubgraphPoolTypeToPoolType(pool.poolType || '');
        const poolTokens = pool.tokens || [];

        await prisma.prismaToken.createMany({
            skipDuplicates: true,
            data: [
                ...poolTokens.map((token) => ({
                    address: token.address,
                    symbol: token.symbol,
                    name: token.name,
                    decimals: token.decimals,
                })),
                {
                    address: pool.address,
                    symbol: pool.symbol || '',
                    name: pool.name || '',
                    decimals: 18,
                },
            ],
        });

        await prisma.prismaPool.create({
            data: {
                id: pool.id,
                createTime: pool.createTime,
                address: pool.address,
                symbol: pool.symbol || '',
                name: pool.name || '',
                decimals: 18,
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
                                address: token.address,
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
                        totalSharesNum: parseFloat(pool.totalShares),
                        totalLiquidity: Math.max(parseFloat(pool.totalLiquidity), 0),
                        volume24h: 0,
                        fees24h: 0,
                        volume48h: 0,
                        fees48h: 0,
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

        await this.createAllTokensRelationshipForPool(pool.id);
        await this.userService.initWalletBalancesForPool(pool.id);
    }

    public async createAllTokensRelationshipForPool(poolId: string): Promise<void> {
        const pool = await prisma.prismaPool.findUnique({
            ...prismaPoolWithExpandedNesting,
            where: { id: poolId },
        });

        if (!pool) {
            return;
        }

        const allTokens = _.flattenDeep(
            pool.tokens.map((token) => [
                token,
                ...(token.nestedPool?.tokens || []).map((nestedToken) => ({
                    ...nestedToken,
                    nestedPoolId: token.nestedPool?.id,
                })),
                ...(token.nestedPool?.tokens.map((nestedToken) =>
                    (nestedToken.nestedPool?.tokens || []).map((doubleNestedToken) => ({
                        ...doubleNestedToken,
                        nestedPoolId: nestedToken.nestedPool?.id,
                    })),
                ) || []),
            ]),
        );

        await prisma.prismaPoolExpandedTokens.createMany({
            skipDuplicates: true,
            data: allTokens.map((token) => ({
                poolId,
                tokenAddress: token.address,
                nestedPoolId: token.nestedPoolId || null,
            })),
        });
    }

    private sortSubgraphPools(subgraphPools: BalancerPoolFragment[]) {
        return _.sortBy(subgraphPools, (pool) => {
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
            case 'ComposableStable':
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
