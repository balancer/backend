import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { prisma } from '../../../prisma/prisma-client';
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants';
import { PrismaPoolType } from '@prisma/client';
import _ from 'lodash';
import { prismaPoolWithExpandedNesting } from '../../../prisma/prisma-types';
import { UserService } from '../../user/user.service';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { networkContext } from '../../network/network-context.service';
import { subgraphToPrisma } from '../subgraph-mapper';

export class PoolCreatorService {
    constructor(private readonly userService: UserService) {}

    private get balancerSubgraphService() {
        return networkContext.services.balancerSubgraphService;
    }

    private get chain() {
        return networkContext.chain;
    }

    public async syncAllPoolsFromSubgraph(blockNumber: number): Promise<string[]> {
        const existingPools = await prisma.prismaPool.findMany({ where: { chain: this.chain } });
        const subgraphPools = await this.balancerSubgraphService.getAllPools({}, false);
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
            } else if (subgraphPool.poolType?.includes('Gyro')) {
                await prisma.prismaPool.update({
                    data: {
                        gyroData: {
                            update: {
                                id: subgraphPool.id,
                                alpha: subgraphPool.alpha || '',
                                beta: subgraphPool.beta || '',
                                sqrtAlpha: subgraphPool.sqrtAlpha || '',
                                sqrtBeta: subgraphPool.sqrtBeta || '',
                                root3Alpha: subgraphPool.root3Alpha || '',
                                c: subgraphPool.c || '',
                                s: subgraphPool.s || '',
                                lambda: subgraphPool.lambda || '',
                                tauAlphaX: subgraphPool.tauAlphaX || '',
                                tauAlphaY: subgraphPool.tauAlphaY || '',
                                tauBetaX: subgraphPool.tauBetaX || '',
                                tauBetaY: subgraphPool.tauBetaY || '',
                                u: subgraphPool.u || '',
                                v: subgraphPool.v || '',
                                w: subgraphPool.w || '',
                                z: subgraphPool.z || '',
                                dSq: subgraphPool.dSq || '',
                            },
                        },
                    },
                    where: {
                        id_chain: {
                            id: subgraphPool.id,
                            chain: this.chain,
                        },
                    },
                });
            }
        }

        return poolIds;
    }

    public async syncNewPoolsFromSubgraph(blockNumber: number): Promise<string[]> {
        const existingPools = await prisma.prismaPool.findMany({ where: { chain: this.chain } });
        const latest = await prisma.prismaPool.findFirst({
            orderBy: { createTime: 'desc' },
            select: { createTime: true },
            where: { chain: this.chain },
        });

        const subgraphPools = await this.balancerSubgraphService.getAllPools(
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
        const subgraphPools = await this.balancerSubgraphService.getAllPools({}, false);
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

                return (
                    nestedPool.address === token.address && (poolType === 'LINEAR' || poolType === 'COMPOSABLE_STABLE')
                );
            });

            if (nestedPool) {
                await prisma.prismaPoolToken.update({
                    where: { id_chain: { id: token.id, chain: this.chain } },
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
            where: { chain: this.chain },
        });

        //clear any existing
        await prisma.prismaPoolExpandedTokens.updateMany({
            where: { chain: this.chain },
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
                                chain: this.chain,
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
                chain: this.chain,
                type: { in: [PrismaPoolType.LINEAR, PrismaPoolType.COMPOSABLE_STABLE] },
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
                    chain: this.chain,
                })),
                {
                    address: pool.address,
                    symbol: pool.symbol || '',
                    name: pool.name || '',
                    decimals: 18,
                    chain: this.chain,
                },
            ],
        });

        const prismaPoolRecordWithAssociations = subgraphToPrisma(pool, this.chain, blockNumber, allNestedTypePools);

        await prisma.prismaPool.create(prismaPoolRecordWithAssociations);

        await prisma.prismaPoolTokenDynamicData.createMany({
            data: poolTokens.map((token) => ({
                id: token.id,
                chain: this.chain,
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
            where: { id_chain: { id: poolId, chain: this.chain } },
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
                chain: this.chain,
                tokenAddress: token.address,
                nestedPoolId: token.nestedPoolId || null,
            })),
        });
    }

    public async reloadPoolTokenIndexes(poolId: string): Promise<void> {
        const { pool: subgraphPool } = await this.balancerSubgraphService.getPool({ id: poolId });

        if (!subgraphPool) {
            throw new Error('Pool with id does not exist');
        }

        const poolTokens = subgraphPool.tokens || [];

        for (let i = 0; i < poolTokens.length; i++) {
            const token = poolTokens[i];

            await prisma.prismaPoolToken.update({
                where: { id_chain: { id: token.id, chain: this.chain } },
                data: {
                    index: token.index || subgraphPool.tokensList.findIndex((address) => address === token.address),
                },
            });
        }
    }

    public async updatePoolTypesAndVersionForAllPools() {
        const subgraphPools = await this.balancerSubgraphService.getAllPools({}, false);

        for (const subgraphPool of subgraphPools) {
            // for the old phantom stable pool, we add it to the DB as type COMPOSABLE_STABLE with version 0
            let poolTypeVersion = subgraphPool.poolTypeVersion ? subgraphPool.poolTypeVersion : 1;
            if (subgraphPool.poolType === 'StablePhantom') {
                poolTypeVersion = 0;
            }

            const poolType = this.mapSubgraphPoolTypeToPoolType(subgraphPool.poolType || '');

            try {
                await prisma.prismaPool.update({
                    where: { id_chain: { chain: networkContext.chain, id: subgraphPool.id } },
                    data: {
                        version: poolTypeVersion,
                        type: poolType,
                    },
                });
            } catch (e: any) {
                // Some pools are filtered from the DB, like test pools,
                // so we just ignore them without breaking the loop
                const error = e.meta ? e.meta.cause : e;
                console.error(
                    'Error in updating pool versions: ',
                    error,
                    'Network',
                    networkContext.chain,
                    'Pool ID: ',
                    subgraphPool.id,
                );
            }
        }
    }

    private sortSubgraphPools(subgraphPools: BalancerPoolFragment[]) {
        return _.sortBy(subgraphPools, (pool) => {
            const poolType = this.mapSubgraphPoolTypeToPoolType(pool.poolType || '');

            if (poolType === 'LINEAR') {
                return 0;
            } else if (poolType === 'COMPOSABLE_STABLE') {
                //if the composable stable has a nested composable stable, it needs to appear later in the list
                const nestedComposableStableToken = (pool.tokens || []).find((token) => {
                    if (token.address === pool.address) {
                        return false;
                    }

                    const nestedPool = subgraphPools.find((nestedPool) => nestedPool.address === token.address);
                    const nestedPoolType = this.mapSubgraphPoolTypeToPoolType(nestedPool?.poolType || '');

                    return nestedPoolType === 'COMPOSABLE_STABLE';
                });

                return nestedComposableStableToken ? 2 : 1;
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
    }
}
