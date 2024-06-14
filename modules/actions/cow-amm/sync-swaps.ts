import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';
import _ from 'lodash';
import { swapV2Transformer } from '../../sources/transformers/swap-v2-transformer';
import { OrderDirection, Swap_OrderBy } from '../../sources/subgraphs/cow-amm/generated/types';
import { swapsUsd } from '../../sources/enrichers/swaps-usd';

/**
 * Adds all swaps since daysToSync to the database. Checks for latest synced swap to avoid duplicate work.
 *
 * @param subgraphClient
 * @param chain
 * @returns
 */
export async function syncSwaps(subgraphClient: CowAmmSubgraphClient, chain = 'SEPOLIA' as Chain) {
    const vaultVersion = 0;

    // Get latest event from the DB
    const latestEvent = await prisma.prismaPoolEvent.findFirst({
        select: {
            blockNumber: true,
        },
        where: {
            type: 'SWAP',
            chain: chain,
            vaultVersion,
        },
        orderBy: {
            blockNumber: 'desc',
        },
    });

    const where = latestEvent?.blockNumber ? { blockNumber_gte: String(latestEvent.blockNumber) } : {};

    // Get events
    const { swaps } = await subgraphClient.Swaps({
        first: 1000,
        where,
        orderBy: Swap_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    // Get pools for matching SG amount to tokens
    const pools = await prisma.prismaPoolDynamicData.findMany({
        where: {
            id: {
                in: swaps.map((swap) => swap.pool).filter((value, index, self) => self.indexOf(value) === index),
            },
        },
        select: {
            id: true,
            swapFee: true,
        },
    });

    // Adding swap fee to the swap object
    const dbSwaps = swaps.map((swap) => {
        const swapFee = pools.find((pool) => pool.id === swap.pool)!.swapFee;

        return swapV2Transformer(
            {
                ...swap,
                id: swap.id,
                block: swap.blockNumber,
                logIndex: swap.logIndex,
                caller: swap.user.id,
                poolId: {
                    id: swap.pool,
                    swapFee,
                },
                userAddress: swap.user,
                tokenIn: swap.tokenIn,
                tokenInSym: swap.tokenInSymbol,
                tokenOutSym: swap.tokenOutSymbol,
                timestamp: Number(swap.blockTimestamp),
                tx: swap.transactionHash,
                valueUSD: '0',
            },
            chain,
            vaultVersion,
        );
    });

    // Enrich with USD values
    const dbEntries = await swapsUsd(dbSwaps, chain);

    await prisma.prismaPoolEvent.createMany({
        skipDuplicates: true,
        data: dbEntries,
    });

    return dbEntries;
}
