import { Chain, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { BalancerVaultSubgraphSource } from '../../sources/subgraphs/balancer-v3-vault';
import _ from 'lodash';
import moment from 'moment';
import { tokenService } from '../../token/token.service';
import { swapsTransformer } from '../../sources/transformers/swaps-transformer';

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
export async function syncSwapsFromSubgraph(
    vaultSubgraphClient: BalancerVaultSubgraphSource,
    chain = 'SEPOLIA' as Chain,
    daysToSync = 30,
): Promise<string[]> {
    const poolIds = new Set<string>();

    // only sync from the latest swap in DB to avoid duplicate work
    const lastSwap = await prisma.prismaPoolSwap.findFirst({
        orderBy: { timestamp: 'desc' },
        where: { chain: chain },
    });

    //ensure we only query the last daysToSync worth of swaps
    const daysToSyncTimestamp = moment().subtract(daysToSync, 'day').unix();
    const timestamp = lastSwap && lastSwap.timestamp > daysToSyncTimestamp ? lastSwap.timestamp : daysToSyncTimestamp;

    const swaps = await vaultSubgraphClient.getSwapsSince(timestamp);

    await prisma.prismaPoolSwap.createMany({
        skipDuplicates: true,
        data: await swapsTransformer(swaps, chain),
    });

    // Do we need to create batch swaps as well?
    //     await this.createBatchSwaps(Array.from(txs));

    // Remove everything older that daysToSync
    await prisma.prismaPoolSwap.deleteMany({
        where: {
            timestamp: { lt: daysToSyncTimestamp },
            chain: chain,
        },
    });
    // await prisma.prismaPoolBatchSwap.deleteMany({
    //     where: {
    //         timestamp: { lt: twoDaysAgo },
    //         chain: this.chain,
    //     },
    // });

    return Array.from(poolIds);
}
