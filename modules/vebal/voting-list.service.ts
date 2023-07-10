import { PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from '../../prisma/prisma-client';

import { chunk, keyBy } from 'lodash';
import {
    OnChainRootGauges,
    RootGauge,
    isValidForVotingList,
    specialRootGaugeAddresses,
    veGauges,
} from './root-gauges.onchain';
import { PrismaRootGauges } from './root-gauges.db';
import { fetchRootGaugesFromSubgraph, updateOnchainGaugesWithSubgraphData } from './root-gauges.subgraph';

/*
We do not have info for veBAl, veUSH  and veLIT or TWAMM so we hardcode the poolIds here
should we will also add a check to throw an error if one of this tokens is killed or if
some of this pools is deleted?
*/
const hardcodedPools: Record<string, string> = {
    '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014': '0xb78543e00712c3abba10d0852f6e38fde2aaba4d', //veBAL
    '0x9232a548dd9e81bac65500b5e0d918f8ba93675c000200000000000000000423': '0x56124eb16441a1ef12a4ccaeabdd3421281b795a', //veLIT
    '0xd689abc77b82803f22c49de5c8a0049cc74d11fd000200000000000000000524': '0x5b79494824bc256cd663648ee1aad251b32693a9', //veUSH

    // '0x6910c4e32d425a834fb61e983c8083a84b0ebd01000200000000000000000532': '0xb5bd58c733948e3d65d86ba9604e06e5da276fd1', //TWAMM
};

function getHardcodedRootGauge(poolId: string) {
    // Make sure that root addresses and poolIds are lowercase
    const hardcoded: Record<string, string> = {};
    Object.entries(hardcodedPools).forEach(([key, value]) => {
        hardcoded[key.toLowerCase()] = value.toLowerCase();
    });

    const veRootGaugeAddress = hardcoded[poolId];
    if (!veRootGaugeAddress) return;
    return {
        relativeWeightCap: null,
        id: veRootGaugeAddress,
    };
}

export class VotingListService {
    constructor(
        private prisma: PrismaClient = prismaClient,
        private onchain = new OnChainRootGauges(),
        private prismaRootGauges = new PrismaRootGauges(),
    ) {}

    public async getVotingList() {
        const validGauges = await this.getValidVotingRootGauges();
        const validRootGaugesByPoolId = keyBy(validGauges, (gauge) => gauge.staking!.staking.poolId);

        let poolIds = Object.keys(validRootGaugesByPoolId);

        // Add ve pools to list
        poolIds = [...poolIds, ...Object.keys(hardcodedPools)];

        const pools = await this.getPoolsForVotingList(poolIds);

        // Adds root gauge info to each pool
        return pools.map((pool) => {
            // Use hardcoded Root gauge data for ve root gauges
            const veRootGauge = getHardcodedRootGauge(pool.id);
            const rootGauge = veRootGauge || validRootGaugesByPoolId[pool.id];
            const votingPool = {
                ...pool,
                gauge: {
                    address: rootGauge.id,
                    relativeWeightCap: rootGauge.relativeWeightCap,
                },
            };
            return votingPool;
        });
    }

    public async getPoolsForVotingList(poolIds: string[]) {
        let pools = await this.prisma.prismaPool.findMany({
            where: {
                id: { in: poolIds },
            },
            select: {
                id: true,
                chain: true,
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
                                logoURI: true,
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
            select: {
                id: true,
                chain: true,
                status: true,
                relativeWeightCap: true,
                relativeWeight: true,
                staking: {
                    select: {
                        staking: {
                            select: { poolId: true },
                        },
                    },
                },
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

        const onchainGauges = await this.onchain.fetchOnchainRootGauges(onchainRootAddresses);

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
