import { Chain, PrismaPoolType } from '@prisma/client';
import { quantAmmWeightedCalls, QuantAMMWeightedCallsOutput } from '../../sources/contracts/pool-type-dynamic-data';
import { prisma } from '../../../prisma/prisma-client';
import { multicallViem } from '../../web3/multicaller-viem';
import { ViemClient } from '../../sources/types';

/**
 * Fetches new weights, updates the pool and creates a new snapshots based on the block number
 */
export const syncWeights = async (client: ViemClient, chain: Chain): Promise<void> => {
    const quantPools = await prisma.prismaPool.findMany({
        where: {
            chain,
            type: PrismaPoolType.QUANT_AMM_WEIGHTED,
        },
        include: {
            tokens: true,
        },
    });

    const quantPoolTokens = quantPools
        .flatMap((pool) => pool.tokens.map((token) => token))
        .reduce((acc, token) => {
            acc[token.id] = token;
            return acc;
        }, {} as Record<string, (typeof quantPools)[0]['tokens'][0]>);

    const calls = quantPools.flatMap(({ id }) => quantAmmWeightedCalls(id));
    const onchainData = (await multicallViem(client, calls)) as Record<string, QuantAMMWeightedCallsOutput>;

    const updates = Object.keys(onchainData).flatMap((id) => onchainData[id].poolToken);

    const timestamp = Number((await client.getBlock()).timestamp);
    const operations = updates
        // Check if the weights are different
        .filter((update) => {
            const token = quantPoolTokens[update.id];
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

    // Store weights snapshots
    const snapshots = Object.keys(onchainData).flatMap((id) => {
        const head = { pool: id, chain, timestamp };
        const weights = onchainData[id].poolToken.reduce(
            (agg, token, index) => {
                agg[`weight${index + 1}` as keyof typeof agg] = Number(token.weight);
                return agg;
            },
            { weight1: 0, weight2: 0 } as {
                weight1: number;
                weight2: number;
                weight3?: number;
                weight4?: number;
                weight5?: number;
                weight6?: number;
                weight7?: number;
                weight8?: number;
            },
        );

        return prisma.quantWeights.create({
            data: {
                ...head,
                ...weights,
            },
        });
    });

    await prisma.$transaction(snapshots);

    return;
};
