import { Chain, Prisma, PrismaLastBlockSyncedCategory, PrismaPoolType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { tokenService } from '../../token/token.service';
import { fetchPoolTokenInfo, fetchPoolTokenRates } from '../../sources/contracts';
import { ViemClient } from '../../sources/viem-client';
import { fetchPoolData } from '../../sources/contracts/fetch-pool-data';
import { formatEther, formatUnits, parseUnits } from 'viem';
import { isSameAddress } from '@balancer-labs/sdk';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { getPoolBalanceChanged } from '../../sources/logs/get-pool-balance-changed';
import { start } from 'repl';
import { getSwaps } from '../../sources/logs';
import _ from 'lodash';

/**
 * Get all pool IDs of pools that have emitted a poolBalanceChanged event
 *
 * @param vaultAddress
 * @param viemClient
 * @param chain
 * @returns list of changed pool IDs
 */
export async function getChangedPools(
    vaultAddress: string,
    viemClient: ViemClient,
    blockNumber: bigint,
    chain = 'SEPOLIA' as Chain,
): Promise<string[]> {
    let lastSync = await prisma.prismaLastBlockSynced.findUnique({
        where: { category_chain: { category: PrismaLastBlockSyncedCategory.POOLS, chain: chain } },
    });
    const lastSyncBlock = lastSync?.blockNumber ? BigInt(lastSync.blockNumber) : 0n;
    const latestBlock = blockNumber;

    const startBlock = lastSyncBlock + 1n;
    const endBlock = latestBlock;

    // no new blocks have been minted, needed for slow networks
    if (startBlock > endBlock) {
        return [];
    }

    const poolBalanceChangedEvents = await getPoolBalanceChanged(vaultAddress, viemClient, startBlock, endBlock);
    const poolIdsFromBalanceChangedEvents = poolBalanceChangedEvents.map((event) => event.args.pool!);

    const swapEvents = await getSwaps(vaultAddress, viemClient, startBlock, endBlock);
    const poolIdsFromSwapEvents = swapEvents.map((event) => event.args.pool!);

    const changedPoolIds = _.uniq(poolIdsFromBalanceChangedEvents.concat(poolIdsFromSwapEvents));

    return changedPoolIds;
}
