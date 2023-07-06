import { PrismaClient } from '@prisma/client';
import { Address } from 'viem';
import { prisma as prismaClient } from '../../prisma/prisma-client';

import { chunk } from 'lodash';
import {
    OnChainRootGauges,
    RootGauge,
    isValidForVotingList,
    specialRootGaugeAddresses,
    veGauges,
} from './root-gauges.onchain';
import { PrismaRootGauges } from './root-gauges.prisma';
import { fetchRootGaugesFromSubgraph, updateOnchainGaugesWithSubgraphData } from './root-gauges.subgraph';

export class VotingListService {
    constructor(
        private prisma: PrismaClient = prismaClient,
        private onchain = new OnChainRootGauges(),
        private prismaRootGauges = new PrismaRootGauges(),
    ) {}

    public async getPoolsForVotingList(poolIds: string[]) {
        let pools = await this.prisma.prismaPool.findMany({
            where: { id: { in: poolIds } },
            select: {
                id: true,
                address: true,
                type: true,
                symbol: true,
                tokens: {
                    select: {
                        address: true,
                        dynamicData: {
                            select: {
                                weight: true,
                            },
                        },
                        token: {
                            select: {
                                symbol: true,
                            },
                        },
                    },
                },
            },
        });

        // Remove BPT
        pools = pools.map((pool) => {
            pool.tokens = pool.tokens.filter((t) => t.address !== pool?.address);
            return pool;
        });
        return pools;
    }

    public async getValidVotingRootGauges() {
        let gaugesWithStaking = await this.prisma.prismaRootStakingGauge.findMany({
            where: {
                stakingId: { not: null },
            },
        });

        return gaugesWithStaking.filter((gauge) =>
            isValidForVotingList({
                isKilled: gauge.status === 'KILLED',
                relativeWeight: Number(gauge.relativeWeight) || 0,
            }),
        );
    }

    async syncRootGauges() {
        await this.prismaRootGauges.deleteRootGauges();

        const onchainRootAddresses = await this.onchain.getRootGaugeAddresses();

        this.sync(onchainRootAddresses);
    }

    async sync(rootGaugeAddresses: string[]) {
        const chunks = chunk(rootGaugeAddresses, 100);

        for (const addressChunk of chunks) {
            const rootGauges = await this.fetchRootGauges(addressChunk);

            /*
                We avoid saving gauges in specialRootGaugeAddresses because they require special handling
                TODO: handle veLIT, TWAMM...
            */
            const cleanRootGauges = rootGauges.filter(
                (gauge) => !specialRootGaugeAddresses.includes(gauge.gaugeAddress),
            );
            await this.prismaRootGauges.saveRootGauges(cleanRootGauges);
        }
    }

    async fetchRootGauges(onchainRootAddresses: string[]) {
        const subgraphGauges = await fetchRootGaugesFromSubgraph(onchainRootAddresses);

        const onchainGauges = await this.onchain.fetchOnchainRootGauges(onchainRootAddresses as Address[]);

        const rootGauges = updateOnchainGaugesWithSubgraphData(onchainGauges, subgraphGauges);

        throwIfMissingRootGaugeData(rootGauges);

        return rootGauges;
    }
}

export const votingListService = new VotingListService();

export function throwIfMissingRootGaugeData(rootGauges: RootGauge[]) {
    const gaugesWithMissingData = rootGauges
        .filter((gauge) => !veGauges.includes(gauge.gaugeAddress))
        .filter((gauge) => !gauge.isInSubgraph)
        .filter(isValidForVotingList);

    if (gaugesWithMissingData.length > 0) {
        const errorMessage =
            'Detected active root gauge/s with votes (relative weight) that are not in subgraph: ' +
            JSON.stringify(gaugesWithMissingData);
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
}
