import { prisma } from '../../prisma/prisma-client';

import { chunk, keyBy } from 'lodash';
import { VotingGauge, VotingGaugesRepository } from './voting-gauges.repository';
import { oldVeBalAddress, specialVotingGaugeAddresses } from './special-pools/special-voting-gauge-addresses';
import { getVeVotingGauges, veGauges, vePools } from './special-pools/ve-pools';
import { hardCodedPools } from './special-pools/hardcoded-pools';
import { GqlVotingPool } from '../../schema';
import { Chain } from '@prisma/client';

export class VeBalVotingListService {
    constructor(private votingGauges = new VotingGaugesRepository()) {}

    /*
        This methods is used by veBalGetVotingList resolver that is consumed by some partners
        We should avoid breaking changes in the involved schema
    */
    public async getVotingListWithHardcodedPools(): Promise<GqlVotingPool[]> {
        return [...(await this.getVotingList()), ...hardCodedPools];
    }

    public async getVotingList(): Promise<GqlVotingPool[]> {
        const validGauges = await this.getValidVotingGauges();
        const validVotingGaugesByPoolId = keyBy(validGauges, (gauge) => gauge.stakingGauge!.staking.poolId);

        let poolIds = Object.keys(validVotingGaugesByPoolId);

        poolIds = [...poolIds, ...Object.keys(vePools)];

        const pools = await this.getPoolsForVotingList(poolIds);
        const poolsById = keyBy(pools, 'id');

        const allGauges = [...validGauges, ...getVeVotingGauges()];

        // For each voting gauge returns a pool with its gauge info inside
        return allGauges.map((votingGauge) => {
            const pool = poolsById[votingGauge.stakingGauge!.staking.poolId];
            // Only L2 networks have childGaugeAddress
            const childGaugeAddress = pool.chain === Chain.MAINNET ? null : votingGauge.stakingGauge?.staking.address;
            const votingPool = {
                id: pool.id,
                chain: pool.chain,
                symbol: pool.symbol,
                address: pool.address,
                type: pool.type,
                tokens: pool.tokens.map((token) => ({
                    address: token.address,
                    weight: token.dynamicData?.weight,
                    symbol: token.token.symbol,
                    logoURI: token.token.logoURI || '',
                })),
                gauge: {
                    address: votingGauge.id,
                    relativeWeightCap: votingGauge.relativeWeightCap,
                    isKilled: votingGauge.status !== 'ACTIVE',
                    addedTimestamp: votingGauge.addedTimestamp,
                    childGaugeAddress,
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

    public async getValidVotingGauges() {
        const gaugesWithStaking = await prisma.prismaVotingGauge.findMany({
            where: {
                stakingGaugeId: { not: null },
            },
            select: {
                id: true,
                chain: true,
                status: true,
                relativeWeightCap: true,
                relativeWeight: true,
                addedTimestamp: true,
                stakingGauge: {
                    select: {
                        staking: {
                            select: {
                                poolId: true,
                                address: true,
                            },
                        },
                    },
                },
            },
        });
        return gaugesWithStaking;
    }

    public async syncVotingGauges() {
        const onchainGaugeAddresses = await this.votingGauges.getVotingGaugeAddresses();

        return this.sync(onchainGaugeAddresses);
    }

    async sync(votingGaugeAddresses: string[]) {
        const chunks = chunk(votingGaugeAddresses, 50);

        for (const addressChunk of chunks) {
            const votingGauges = await this.fetchVotingGauges(addressChunk);

            /*
                We avoid saving gauges in specialVotingGaugeAddresses because they require special handling
            */
            const cleanVotingGauges = votingGauges.filter(
                (gauge) => !specialVotingGaugeAddresses.includes(gauge.gaugeAddress),
            );

            await this.votingGauges.saveVotingGauges(cleanVotingGauges);
        }
    }

    async fetchVotingGauges(votingGaugeAddresses: string[]) {
        const subgraphGauges = await this.votingGauges.fetchVotingGaugesFromSubgraph(votingGaugeAddresses);

        const onchainGauges = await this.votingGauges.fetchOnchainVotingGauges(votingGaugeAddresses);

        const votingGauges = this.votingGauges.updateOnchainGaugesWithSubgraphData(onchainGauges, subgraphGauges);

        this.throwIfMissingVotingGaugeData(votingGauges);

        return votingGauges;
    }

    throwIfMissingVotingGaugeData(votingGauges: VotingGauge[]) {
        const gaugesWithMissingData = votingGauges
            .filter((gauge) => !veGauges.includes(gauge.gaugeAddress))
            .filter((gauge) => !gauge.isInSubgraph)
            .filter(this.votingGauges.isValidForVotingList)
            // Ignore old Vebal gauge address
            .filter((gauge) => gauge.gaugeAddress !== oldVeBalAddress);

        if (gaugesWithMissingData.length > 0) {
            const errorMessage =
                'Detected active voting gauge/s with votes (relative weight > 0) that are not in subgraph: ' +
                JSON.stringify(gaugesWithMissingData);
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }
}

export const veBalVotingListService = new VeBalVotingListService();
