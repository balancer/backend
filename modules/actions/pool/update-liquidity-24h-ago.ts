import { Chain } from '@prisma/client';
import { BlockNumbersSubgraphClient, V3VaultSubgraphClient } from '../../sources/subgraphs';
import { V2SubgraphClient } from '../../subgraphs/balancer-subgraph';
import { getLiquidityAndSharesAtTimestamp } from '../../sources/enrichers/get-liquidity-and-shares-at-timestamp';
import { daysAgo, hoursAgo } from '../../common/time';
import { prisma } from '../../../prisma/prisma-client';

/**
 * Updates the total liquidity 24h ago for the given pools
 * Comment: is this really necessary to have in the pools? We have snapshots
 *
 * @param ids
 * @param subgraphClient
 * @param blocksClient
 * @param chain
 * @returns
 */
export const updateLiquidity24hAgo = async (
    ids: string[],
    subgraphClient: V2SubgraphClient | V3VaultSubgraphClient,
    blocksClient: BlockNumbersSubgraphClient,
    chain: Chain,
) => {
    // Get liquidity data
    const ts = chain === Chain.SEPOLIA ? hoursAgo(1) : daysAgo(1);
    const data = await getLiquidityAndSharesAtTimestamp(ids, subgraphClient, blocksClient, ts);
    if (!data) return;

    // Update liquidity data
    const updates = Object.entries(data).map(([id, { tvl, totalShares }]) => {
        return {
            where: {
                poolId_chain: {
                    poolId: id,
                    chain,
                },
            },
            data: {
                totalLiquidity24hAgo: tvl,
                totalShares24hAgo: totalShares,
            },
        };
    });

    const updated: string[] = [];
    for (const update of updates) {
        try {
            await prisma.prismaPoolDynamicData.update(update);
            updated.push(update.where.poolId_chain.poolId);
        } catch (e) {
            // TODO: Some V2 pools are missing dynamic data on creation. Should be fixed when creating new pool records.
            // https://github.com/balancer/backend/issues/288
            console.error(
                `Error updating liquidity 24h ago for pool ${update.where.poolId_chain.poolId} ${update.where.poolId_chain.chain} with error: ${e}`,
            );
        }
    }

    return updated;
};
