import { Chain, PrismaPoolType } from '@prisma/client';
import { lbpCalls, LBPCallsOutput } from '../../sources/contracts/pool-type-dynamic-data';
import { prisma } from '../../../prisma/prisma-client';
import { multicallViem } from '../../web3/multicaller-viem';
import { ViemClient } from '../../sources/types';

/**
 * Fetches new weights and updates pool tokens
 */
export const syncWeights = async (client: ViemClient, chain: Chain): Promise<void> => {
    const [pools, tokens, dynamicDataMap] = await Promise.all([
        prisma.prismaPool.findMany({
            where: {
                chain,
                type: PrismaPoolType.LIQUIDITY_BOOTSTRAPPING,
                protocolVersion: 3,
            },
            select: { id: true },
        }),
        prisma.prismaPoolToken
            .findMany({
                where: {
                    pool: {
                        chain,
                        type: PrismaPoolType.LIQUIDITY_BOOTSTRAPPING,
                        protocolVersion: 3,
                    },
                },
                select: {
                    id: true,
                    weight: true,
                },
            })
            .then((records) =>
                records.reduce(
                    (acc, token) => {
                        acc[token.id] = token;
                        return acc;
                    },
                    {} as Record<string, (typeof records)[0]>,
                ),
            ),
        prisma.prismaPoolDynamicData
            .findMany({
                where: { chain, pool: { chain, type: PrismaPoolType.LIQUIDITY_BOOTSTRAPPING, protocolVersion: 3 } },
                select: { id: true, swapEnabled: true },
            })
            .then((records) => Object.fromEntries(records.map((dd) => [dd.id, dd]))),
    ]);

    const calls = pools.flatMap(({ id }) => lbpCalls(id));
    const onchainData = (await multicallViem(client, calls)) as Record<string, LBPCallsOutput>;

    const updates = Object.keys(onchainData).flatMap((id) => onchainData[id].poolToken);

    const operations = updates
        // Check if the weights are different
        .filter((update) => {
            const token = tokens[update.id];
            return token.weight !== update.weight;
        })
        .flatMap((update) =>
            prisma.prismaPoolToken.update({
                where: { id_chain: { id: update.id, chain } },
                data: {
                    weight: update.weight,
                },
            }),
        );

    // Update swapEnabled as well
    const swapEnabledUpdates = Object.keys(onchainData)
        .map((id) => onchainData[id].poolDynamicData)
        .filter((update) => update.swapEnabled !== dynamicDataMap[update.id]!.swapEnabled)
        .map((update) =>
            prisma.prismaPoolDynamicData.update({
                where: { id_chain: { id: update.id, chain } },
                data: {
                    swapEnabled: update.swapEnabled,
                },
            }),
        );

    await prisma.$transaction([...operations, ...swapEnabledUpdates]);

    return;
};
