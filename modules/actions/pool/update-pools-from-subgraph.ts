import { Chain, Prisma, PrismaPoolType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import {
    poolTransformer,
    poolTokensTransformer,
    poolTokensDynamicDataTransformer,
    poolExpandedTokensTransformer,
} from '../../sources/transformers';
import { V3PoolsSubgraphClient } from '../../subgraphs/balancer-v3-pools';
import { BalancerVaultSubgraphSource } from '../../sources/subgraphs/balancer-v3-vault';
import _ from 'lodash';
import { tokensTransformer } from '../../sources/transformers/tokens-transformer';

type PoolDbEntry = {
    pool: Prisma.PrismaPoolCreateInput;
    poolTokenDynamicData: Prisma.PrismaPoolTokenDynamicDataCreateManyInput[];
    poolExpandedTokens: Prisma.PrismaPoolExpandedTokensCreateManyInput[];
};

/**
 * Makes sure that all pools are synced in the database
 *
 * @param vaultSubgraphClient
 * @param poolSubgraphClient
 * @param chain
 * @returns syncedPools - the pools that were synced
 */
export async function updatePoolsFromSubgraph(
    vaultSubgraphClient: BalancerVaultSubgraphSource,
    poolSubgraphClient: V3PoolsSubgraphClient,
    chain = 'SEPOLIA' as Chain,
) {
    // Fetch pools from subgraph
    const vaultSubgraphPools = await vaultSubgraphClient.getAllInitializedPools();
    const { pools: poolSubgraphPools } = await poolSubgraphClient.Pools();

    // Find pools missing from the database
    const dbPools = await prisma.prismaPool.findMany({ where: { chain, vaultVersion: 3 } });
    const dbPoolIds = new Set(dbPools.map((pool) => pool.id.toLowerCase()));
    const presentPools = vaultSubgraphPools.filter((pool) => dbPoolIds.has(pool.id));

    // Making sure all tokens are present
    try {
        const allTokens = tokensTransformer(presentPools, chain);
        await prisma.prismaToken.createMany({
            data: allTokens,
            skipDuplicates: true,
        });
    } catch (e) {
        console.error('Error creating tokens', e);
    }

    for (const presentPool of presentPools) {
        const vaultSubgraphPool = vaultSubgraphPools.find((pool) => pool.id === presentPool.id);
        const poolSubgraphPool = poolSubgraphPools.find((pool) => pool.id === presentPool.id);
        if (!vaultSubgraphPool || !poolSubgraphPool) {
            // That won't happen, but TS doesn't know that
            continue;
        }

        const dbPool = poolTransformer(vaultSubgraphPool, poolSubgraphPool, chain);

        await prisma.prismaPool.update({
            where: { id_chain: { id: presentPool.id, chain: chain } },
            data: {
                owner: dbPool.owner,
                type: dbPool.type,
                typeData: dbPool.typeData,
                version: dbPool.version,
            },
        });

        const transformedPoolToken = poolTokensTransformer(vaultSubgraphPool, chain);

        for (const poolToken of transformedPoolToken) {
            await prisma.prismaPoolToken.update({
                where: { id_chain: { id: poolToken.id, chain: chain } },
                data: {
                    nestedPoolId: poolToken.nestedPoolId,
                },
            });
        }

        const transformedPoolExpandedTokens = poolExpandedTokensTransformer(vaultSubgraphPool, chain);

        for (const poolToken of transformedPoolExpandedTokens) {
            await prisma.prismaPoolExpandedTokens.update({
                where: {
                    tokenAddress_poolId_chain: {
                        chain: chain,
                        poolId: presentPool.id,
                        tokenAddress: poolToken.tokenAddress,
                    },
                },
                data: {
                    nestedPoolId: poolToken.nestedPoolId,
                },
            });
        }
    }
}
