import { Chain, PrismaPool } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { nestedPoolWithSingleLayerNesting } from '../../../prisma/prisma-types';
import { V2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { subgraphToPrismaCreate } from '../subgraph-mapper';
import _ from 'lodash';

export const createNewPoolsV2 = async (
    subgraphService: V2SubgraphClient,
    chain: Chain,
    poolIds: string[],
): Promise<void> => {
    const subgraphPools = await subgraphService.legacyService.getAllPools({ where: { id_in: poolIds } }, false);
    const blockNumber = await subgraphService.legacyService.lastSyncedBlock();

    // Any pool can be nested
    const allNestedTypePools = [...subgraphPools.map((pool) => ({ id: pool.id, address: pool.address }))];

    for (const subgraphPool of subgraphPools) {
        await createPoolRecord(subgraphPool, chain, blockNumber, allNestedTypePools);
    }
};

const createPoolRecord = async (
    pool: BalancerPoolFragment,
    chain: Chain,
    blockNumber: number,
    nestedPools: { id: string; address: string }[],
): Promise<PrismaPool | undefined> => {
    const poolTokens = pool.tokens || [];

    await prisma.prismaToken.createMany({
        skipDuplicates: true,
        data: [
            ...poolTokens.map((token) => ({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                chain,
            })),
            {
                address: pool.address.toLowerCase(),
                symbol: pool.symbol || '',
                name: pool.name || '',
                decimals: 18,
                chain,
            },
        ],
    });

    const prismaPoolRecordWithAssociations = subgraphToPrismaCreate(pool, chain, blockNumber, nestedPools);

    try {
        const pool = await prisma.prismaPool.create(prismaPoolRecordWithAssociations);

        await createAllTokensRelationshipForPool(pool.id, chain);

        return pool;
    } catch (e) {
        console.error(`Could not create pool ${pool.id} on chain ${chain}. Skipping.`, e);
    }
};

const createAllTokensRelationshipForPool = async (poolId: string, chain: Chain): Promise<void> => {
    const pool = await prisma.prismaPool.findUnique({
        ...nestedPoolWithSingleLayerNesting,
        where: { id_chain: { id: poolId, chain } },
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
        ]),
    );

    await prisma.prismaPoolExpandedTokens.createMany({
        skipDuplicates: true,
        data: allTokens.map((token) => ({
            poolId,
            chain,
            tokenAddress: token.address,
            nestedPoolId: token.nestedPoolId || null,
        })),
    });
};
