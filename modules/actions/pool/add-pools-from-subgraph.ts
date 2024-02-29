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
export async function addMissingPoolsFromSubgraph(
    vaultSubgraphClient: BalancerVaultSubgraphSource,
    poolSubgraphClient: V3PoolsSubgraphClient,
    chain = 'SEPOLIA' as Chain,
): Promise<string[]> {
    // Fetch pools from subgraph
    const vaultSubgraphPools = await vaultSubgraphClient.getAllInitializedPools();
    const { pools: poolSubgraphPools } = await poolSubgraphClient.Pools();

    // Find pools missing from the database
    const dbPools = await prisma.prismaPool.findMany({ where: { chain, vaultVersion: 3 } });
    const dbPoolIds = new Set(dbPools.map((pool) => pool.id.toLowerCase()));
    const missingPools = vaultSubgraphPools.filter((pool) => !dbPoolIds.has(pool.id));

    // Store pool tokens and BPT in the tokens table before creating the pools
    try {
        const allTokens = tokensTransformer(missingPools, chain);
        await prisma.prismaToken.createMany({
            data: allTokens,
            skipDuplicates: true,
        });
    } catch (e) {
        console.error('Error creating tokens', e);
    }

    // Transform pool data for the database
    const dbEntries: PoolDbEntry[] = [];

    missingPools.forEach((missingPool) => {
        const vaultSubgraphPool = vaultSubgraphPools.find((pool) => pool.id === missingPool.id);
        const poolSubgraphPool = poolSubgraphPools.find((pool) => pool.id === missingPool.id);
        if (!vaultSubgraphPool || !poolSubgraphPool) {
            // That won't happen, but TS doesn't know that
            return null;
        }
        const dbEntry: PoolDbEntry = {
            pool: {
                ...poolTransformer(vaultSubgraphPool, poolSubgraphPool, chain),
                typeData: JSON.stringify({}),
                tokens: {
                    createMany: {
                        // TODO: Will be great to create all the token data here, including dynamic data
                        // but for now we can only store static data, because prisma doesn't support nested createMany
                        // to create dynamic data tabels as well. One solution is to move "dynamicData" to the tokens table
                        data: poolTokensTransformer(vaultSubgraphPool, chain),
                    },
                },
                // placeholder data, will be updated with onchain values
                dynamicData: {
                    create: {
                        id: vaultSubgraphPool.id,
                        swapFee: '0',
                        blockNumber: Number(vaultSubgraphPool.blockNumber),
                        swapEnabled: true,
                        totalLiquidity: 1,
                        totalShares: vaultSubgraphPool.totalShares,
                        totalSharesNum: parseFloat(vaultSubgraphPool.totalShares),
                    },
                },
            },
            poolTokenDynamicData: poolTokensDynamicDataTransformer(vaultSubgraphPool, poolSubgraphPool, chain),
            poolExpandedTokens: poolExpandedTokensTransformer(vaultSubgraphPool, chain),
        };
        dbEntries.push(dbEntry);
    });

    // Store missing pools in the database
    const added: string[] = [];
    for (const entry of dbEntries) {
        try {
            await prisma.prismaPool.create({ data: entry.pool });

            await prisma.prismaPoolTokenDynamicData.createMany({
                skipDuplicates: true,
                data: entry.poolTokenDynamicData,
            });

            await prisma.prismaPoolExpandedTokens.createMany({
                skipDuplicates: true,
                data: entry.poolExpandedTokens,
            });

            added.push(entry.pool.id);
        } catch (e) {
            // TODO: handle errors
            console.error(`Error creating pool ${entry.pool.id}`, e);
        }
    }

    return added;
}
