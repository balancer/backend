import { Chain } from '@prisma/client';
import { BlockNumbersSubgraphClient, V3VaultSubgraphClient } from '../../sources/subgraphs';
import { V2VaultSubgraphClient } from '../../subgraphs/balancer-subgraph';
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
    subgraphClient: V2VaultSubgraphClient | V3VaultSubgraphClient,
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

    return prisma.$transaction(updates.map((update) => prisma.prismaPoolDynamicData.update(update)));
};
