import { balancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { prisma } from '../../../prisma/prisma-client';
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants';
import { PrismaPoolType } from '@prisma/client';
import _ from 'lodash';
import { prismaPoolWithExpandedNesting } from '../../../prisma/prisma-types';
import { UserService } from '../../user/user.service';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { networkContext } from '../../network/network-context.service';

export class PoolCreatorService {
    constructor(private readonly userService: UserService) {}

    public async syncAllPoolsFromSubgraph(blockNumber: number): Promise<string[]> {
        const existingPools = await prisma.prismaPool.findMany({ where: { chain: networkContext.chain } });
        const subgraphPools = await balancerSubgraphService.getAllPools({}, false);
        const sortedSubgraphPools = this.sortSubgraphPools(subgraphPools);

        const poolIds: string[] = [];

        let counter = 1;
        for (const subgraphPool of sortedSubgraphPools) {
            console.log(`Syncing pool ${counter} of ${sortedSubgraphPools.length}`);
            counter = counter + 1;
            const existsInDb = !!existingPools.find((pool) => pool.id === subgraphPool.id);

            if (!existsInDb) {
                await this.createPoolRecord(subgraphPool, blockNumber);

                poolIds.push(subgraphPool.id);
            }
        }

        return poolIds;
    }

    public async syncNewPoolsFromSubgraph(blockNumber: number): Promise<string[]> {
        const existingPools = await prisma.prismaPool.findMany({ where: { chain: networkContext.chain } });
        const latest = await prisma.prismaPool.findFirst({
            orderBy: { createTime: 'desc' },
            select: { createTime: true },
            where: { chain: networkContext.chain },
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
                await this.createPoolRecord(subgraphPool, blockNumber);

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
                    where: { id_chain: { id: token.id, chain: networkContext.chain } },
                    data: { nestedPoolId: nestedPool.id },
                });
            }
        }

        await this.createAllTokensRelationshipForPool(poolId);
    }

    public async reloadAllTokenNestedPoolIds(): Promise<void> {
        let operations: any[] = [];
        const pools = await prisma.prismaPool.findMany({
            ...prismaPoolWithExpandedNesting,
            where: { chain: networkContext.chain },
        });

        //clear any existing
        await prisma.prismaPoolExpandedTokens.updateMany({
            where: { chain: networkContext.chain },
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
                        where: {
                            tokenAddress_poolId_chain: {
                                tokenAddress: token.address,
                                poolId: pool.id,
                                chain: networkContext.chain,
                            },
                        },
                        data: { nestedPoolId: token.nestedPoolId },
                    }),
                ),
            ];
        }

        await prismaBulkExecuteOperations(operations);
    }

    private async createPoolRecord(pool: BalancerPoolFragment, blockNumber: number) {
        const poolType = this.mapSubgraphPoolTypeToPoolType(pool.poolType || '');
        const poolTokens = pool.tokens || [];

        const allNestedTypePools = await prisma.prismaPool.findMany({
            where: {
                chain: networkContext.chain,
                type: { in: [PrismaPoolType.LINEAR, PrismaPoolType.PHANTOM_STABLE] },
            },
            select: { id: true, address: true },
        });

        await prisma.prismaToken.createMany({
            skipDuplicates: true,
            data: [
                ...poolTokens.map((token) => ({
                    address: token.address,
                    symbol: token.symbol,
                    name: token.name,
                    decimals: token.decimals,
                    chain: networkContext.chain,
                })),
                {
                    address: pool.address,
                    symbol: pool.symbol || '',
                    name: pool.name || '',
                    decimals: 18,
                    chain: networkContext.chain,
                },
            ],
        });

        await prisma.prismaPool.create({
            data: {
                id: pool.id,
                chain: networkContext.chain,
                createTime: pool.createTime,
                address: pool.address,
                symbol: pool.symbol || '',
                name: pool.name || '',
                decimals: 18,
                type: poolType,
                version: pool.poolTypeVersion ? pool.poolTypeVersion : 1,
                owner: pool.owner || ZERO_ADDRESS,
                factory: pool.factory,
                tokens: {
                    createMany: {
                        data: poolTokens.map((token) => {
                            const nestedPool = allNestedTypePools.find((nestedPool) => {
                                return nestedPool.address === token.address;
                            });

                            return {
                                id: token.id,
                                address: token.address,
                                nestedPoolId: nestedPool?.id,
                                index: token.index || pool.tokensList.findIndex((address) => address === token.address),
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
                gyroData: ['GYRO', 'GYRO3', 'GYROE'].includes(poolType)
                    ? {
                          create: {
                              id: pool.id,
                              alpha: pool.alpha || '',
                              beta: pool.beta || '',
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
                chain: networkContext.chain,
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
            where: { id_chain: { id: poolId, chain: networkContext.chain } },
        });

        if (!pool) {
            return;
        }

        const allTokens = _.flattenDeep(
            pool.tokens.map((token) => [
                token,
                ...(token.nestedPool?.tokens || []).map((nestedToken) => ({
                    ...nestedToken,
                    nestedPoolId: token.nestedPool?.id || null,
                })),
                ...(token.nestedPool?.tokens.map((nestedToken) =>
                    (nestedToken.nestedPool?.tokens || []).map((doubleNestedToken) => ({
                        ...doubleNestedToken,
                        nestedPoolId: nestedToken.nestedPool?.id || null,
                    })),
                ) || []),
            ]),
        );

        await prisma.prismaPoolExpandedTokens.createMany({
            skipDuplicates: true,
            data: allTokens.map((token) => ({
                poolId,
                chain: networkContext.chain,
                tokenAddress: token.address,
                nestedPoolId: token.nestedPoolId || null,
            })),
        });
    }

    public async reloadPoolTokenIndexes(poolId: string): Promise<void> {
        const { pool: subgraphPool } = await balancerSubgraphService.getPool({ id: poolId });

        if (!subgraphPool) {
            throw new Error('Pool with id does not exist');
        }

        const poolTokens = subgraphPool.tokens || [];

        for (let i = 0; i < poolTokens.length; i++) {
            const token = poolTokens[i];

            await prisma.prismaPoolToken.update({
                where: { id_chain: { id: token.id, chain: networkContext.chain } },
                data: {
                    index: token.index || subgraphPool.tokensList.findIndex((address) => address === token.address),
                },
            });
        }
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
    }
}
