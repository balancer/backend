import { prisma } from '../../prisma/prisma-client';

import { chunk, keyBy } from 'lodash';
import { RootGauge, RootGaugesRepository, isValidForVotingList } from './root-gauges.repository';
import { specialRootGaugeAddresses } from './special-pools/special-root-gauge-addresses';
import { getHardcodedRootGauge, veGauges, vePools } from './special-pools/ve-pools';
import { hardCodedPools } from './special-pools/hardcoded-pools';

export type VotingListPool = Awaited<ReturnType<VotingListService['getVotingList']>>[number];

export class VotingListService {
    constructor(private rootGauges = new RootGaugesRepository()) {}

    public async getVotingListWithHardcodedPools() {
        return [...(await this.getVotingList()), ...hardCodedPools];
    }

    public async getVotingList() {
        const validGauges = await this.getValidVotingRootGauges();
        const validRootGaugesByPoolId = keyBy(validGauges, (gauge) => gauge.staking!.staking.poolId);

        let poolIds = Object.keys(validRootGaugesByPoolId);

        poolIds = [...poolIds, ...Object.keys(vePools)];

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
                    isKilled: rootGauge.status !== 'ACTIVE',
                },
            };
            return votingPool;
        });
    }

    public async getPoolsForVotingList(poolIds: string[]) {
        let pools = await prisma.prismaPool.findMany({
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
        let gaugesWithStaking = await prisma.prismaRootStakingGauge.findMany({
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
        await this.rootGauges.deleteRootGauges();

        const onchainRootAddresses = await this.rootGauges.getRootGaugeAddresses();

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
            await this.rootGauges.saveRootGauges(cleanRootGauges);
        }
    }

    async fetchRootGauges(onchainRootAddresses: string[]) {
        const subgraphGauges = await this.rootGauges.fetchRootGaugesFromSubgraph(onchainRootAddresses);

        const onchainGauges = await this.rootGauges.fetchOnchainRootGauges(onchainRootAddresses);

        const rootGauges = this.rootGauges.updateOnchainGaugesWithSubgraphData(onchainGauges, subgraphGauges);

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
            'Detected active root gauge/s with votes (relative weight > 0) that are not in subgraph: ' +
            JSON.stringify(gaugesWithMissingData);
        console.error(errorMessage);
        //TODO: Replace by sentry error
        throw new Error(errorMessage);
    }
}
