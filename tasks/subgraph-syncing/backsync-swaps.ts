import { getV2SubgraphClient } from '../../modules/subgraphs/balancer-subgraph';
import config from '../../config';
import { chainIdToChain } from '../../modules/network/chain-id-to-chain';
import { prisma } from '../../prisma/prisma-client';
import { swapV2Transformer } from '../../modules/sources/transformers/swap-v2-transformer';
import { swapsUsd } from '../../modules/sources/enrichers/swaps-usd';

export const backsyncSwaps = async (chainId: string) => {
    const chain = chainIdToChain[chainId];
    const subgraphUrl = config[chain].subgraphs.balancer;
    const subgraphClient = getV2SubgraphClient(subgraphUrl);

    // Read last synced ID from DB - use empty event as a placeholder
    const syncingStatus = await prisma.prismaPoolEvent.findFirst({
        where: {
            id: {
                equals: '0',
            },
        },
    });

    const lastSyncedId = syncingStatus?.tx;

    const { swaps } = await subgraphClient.BalancerSwaps({
        first: 1000,
        where: {
            id_gt: lastSyncedId || '0',
        },
    });

    if (!swaps || swaps.length === 0) {
        await prisma.prismaPoolEvent.delete({
            where: {
                id_chain: {
                    id: '0',
                    chain,
                },
            },
        });
        console.log('No new swaps found');
        return;
    }

    const dbSwaps = swaps.map((swap) => swapV2Transformer(swap, chain));
    const dbEntries = await swapsUsd(dbSwaps, chain);

    // Delete existing entries
    await prisma.prismaPoolEvent.deleteMany({
        where: {
            chain,
            id: {
                in: [...dbEntries.map((entry) => entry.id)],
            },
        },
    });

    // Insert new entries
    await prisma.prismaPoolEvent.createMany({
        skipDuplicates: true,
        data: dbEntries,
    });

    // Update syncing status
    await prisma.prismaPoolEvent.upsert({
        where: {
            id_chain: {
                id: '0',
                chain,
            },
        },
        update: {
            tx: dbEntries[dbEntries.length - 1].id,
        },
        create: {
            id: '0',
            blockNumber: 0,
            blockTimestamp: 0,
            poolId: '',
            userAddress: '',
            chain,
            type: 'SWAP',
            logIndex: 0,
            valueUSD: 0,
            payload: {},
            tx: dbEntries[dbEntries.length - 1].id,
        },
    });

    return `Synced ${dbEntries.length} swaps`;
};
