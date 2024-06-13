import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { CowAmmSubgraphClient } from '../../sources/subgraphs';
import { InvestType, JoinExitFragment } from '../../sources/subgraphs/balancer-v3-vault/generated/types';
import { AddRemove_OrderBy, OrderDirection } from '../../sources/subgraphs/cow-amm/generated/types';
import { joinExitsUsd } from '../../sources/enrichers/join-exits-usd';
import { joinExitV3Transformer } from '../../sources/transformers/join-exit-v3-transformer';

/**
 * Get the join and exit events from the subgraph and store them in the database
 *
 * @param vaultSubgraphClient
 */
export const syncJoinExits = async (subgraphClient: CowAmmSubgraphClient, chain: Chain): Promise<string[]> => {
    const vaultVersion = 0;

    // Get latest event from the DB
    const latestEvent = await prisma.prismaPoolEvent.findFirst({
        where: {
            type: {
                in: ['JOIN', 'EXIT'],
            },
            chain: chain,
            vaultVersion,
        },
        orderBy: {
            blockNumber: 'desc',
        },
    });

    const where = latestEvent?.blockNumber ? { blockNumber_gt: String(latestEvent.blockNumber) } : {};

    // Get events
    const { addRemoves } = await subgraphClient.AddRemoves({
        first: 1000,
        where,
        orderBy: AddRemove_OrderBy.BlockNumber,
        orderDirection: OrderDirection.Asc,
    });

    // Get token indexes for matching SG amount to tokens
    const poolTokens = await prisma.prismaPoolToken.findMany({
        where: {
            poolId: {
                in: addRemoves.map((ar) => ar.pool.id).filter((value, index, self) => self.indexOf(value) === index),
            },
        },
    });

    // Transform COW AMM types to V3 types
    const joinExits = addRemoves.map((addRemove): JoinExitFragment => {
        const dbTokens = poolTokens.filter((token) => token.poolId === addRemove.pool.id);

        return {
            ...addRemove,
            type: addRemove.type === 'Add' ? InvestType.Join : InvestType.Exit,
            pool: {
                id: addRemove.pool.id,
                tokens: addRemove.pool.tokens.map((token) => ({
                    index: dbTokens.find((dbToken) => dbToken.address === token.address)!.index,
                    address: token.address,
                })),
            },
        };
    });

    // Prepare DB entries
    const dbEntries = await joinExitV3Transformer(joinExits, chain);

    console.log(`Syncing ${dbEntries.length} join/exit events`);

    // Enrich with USD values
    const dbEntriesWithUsd = await joinExitsUsd(dbEntries, chain);

    // Create entries and skip duplicates
    await prisma.prismaPoolEvent
        .createMany({
            data: dbEntriesWithUsd,
            skipDuplicates: true,
        })
        .catch((e) => {
            console.error('Error creating DB entries', e);
        });

    return dbEntries.map((entry) => entry.id);
};
