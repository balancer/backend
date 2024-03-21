import { Chain } from '@prisma/client';
import { BlockNumbersClient, V3VaultSubgraphClient } from '../../sources/subgraphs';
import { V2VaultSubgraphClient } from '../../subgraphs/balancer-subgraph';
import { getLiquidityAtTimestamp } from '../../sources/enrichers/get-liquidity-at-timestamp';
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
    blocksClient: BlockNumbersClient,
    chain: Chain,
) => {
    // Get liquidity data
    const ts = chain === Chain.SEPOLIA ? hoursAgo(1) : daysAgo(1);
    const tvls = await getLiquidityAtTimestamp(ids, subgraphClient, blocksClient, ts);
    if (!tvls) return;

    // Update liquidity data
    const updates = Object.entries(tvls).map(([id, liquidity]) => {
        return {
            where: {
                poolId_chain: {
                    poolId: id,
                    chain,
                },
            },
            data: {
                totalLiquidity24hAgo: liquidity,
            },
        };
    });

    return prisma.$transaction(updates.map((update) => prisma.prismaPoolDynamicData.update(update)));
};
