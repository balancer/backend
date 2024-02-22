import { Chain, Prisma } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { BalancerVaultSubgraphSource } from '../../sources/subgraphs/balancer-v3-vault';
import _ from 'lodash';
import moment from 'moment';
import { tokenService } from '../../token/token.service';

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
    // viemClient: ViemClient,
    // vaultAddress: string,
    chain = 'SEPOLIA' as Chain,
    daysToSync = 7,
): Promise<string[]> {
    const poolIds = new Set<string>();
    const txs = new Set<string>();
    const tokenPrices = await tokenService.getTokenPrices(chain);

    const lastSwap = await prisma.prismaPoolSwap.findFirst({
        orderBy: { timestamp: 'desc' },
        where: { chain: chain },
    });

    const daysToSyncTimestamp = moment().subtract(daysToSync, 'day').unix();
    //ensure we only sync the last 48 hours worth of swaps
    const timestamp = lastSwap && lastSwap.timestamp > daysToSyncTimestamp ? lastSwap.timestamp : daysToSyncTimestamp;

    // TODO use paging
    const swaps = await vaultSubgraphClient.getSwapsSince(timestamp);

    await prisma.prismaPoolSwap.createMany({
        skipDuplicates: true,
        data: swaps.map((swap) => {
            let valueUSD = 0;
            const tokenInPrice = tokenService.getPriceForToken(tokenPrices, swap.tokenIn); // TODO need to get price close to swap timestamp
            const tokenOutPrice = tokenService.getPriceForToken(tokenPrices, swap.tokenOut); // TODO need to get price close to swap timestamp

            if (tokenInPrice > 0) {
                valueUSD = tokenInPrice * parseFloat(swap.tokenAmountIn);
            } else {
                valueUSD = tokenOutPrice * parseFloat(swap.tokenAmountOut);
            }

            poolIds.add(swap.pool);
            txs.add(swap.transactionHash);

            return {
                id: swap.id,
                chain: chain,
                timestamp: parseFloat(swap.blockTimestamp),
                poolId: swap.pool,
                userAddress: '0x000', //swap.user.id,
                tokenIn: swap.tokenIn,
                tokenInSym: swap.tokenIn, // TODO add symbol
                tokenOut: swap.tokenOut,
                tokenOutSym: swap.tokenOut, // TODO add symbol
                tokenAmountIn: swap.tokenAmountIn,
                tokenAmountOut: swap.tokenAmountOut,
                tx: swap.transactionHash,
                valueUSD,
            };
        }),
    });

    // Do we need to create batch swaps as well?
    //     await this.createBatchSwaps(Array.from(txs));

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
