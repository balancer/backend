import { Chain, PrismaPoolType } from '@prisma/client';
import { lbpCalls, LBPCallsOutput } from '../../sources/contracts/pool-type-dynamic-data';
import { prisma } from '../../../prisma/prisma-client';
import { multicallViem } from '../../web3/multicaller-viem';
import { ViemClient } from '../../sources/types';

/**
 * Fetches new weights and updates pool tokens
 */
export const syncWeights = async (client: ViemClient, chain: Chain): Promise<void> => {
    const pools = await prisma.prismaPool.findMany({
        where: {
            chain,
            type: PrismaPoolType.LIQUIDITY_BOOTSTRAPPING,
            protocolVersion: 3,
        },
        include: {
            tokens: true,
        },
    });

    const tokens = pools
        .flatMap((pool) => pool.tokens.map((token) => token))
        .reduce((acc, token) => {
            acc[token.id] = token;
            return acc;
        }, {} as Record<string, (typeof pools)[0]['tokens'][0]>);

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

    await prisma.$transaction(operations);

    return;
};
