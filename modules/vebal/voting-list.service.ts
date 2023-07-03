import { Chain, PrismaClient } from '@prisma/client';
import { Address } from 'viem';
import { prisma as prismaClient } from '../../prisma/prisma-client';

import { RootGauge } from './root-gauges.onchain';

export class VotingListService {
    constructor(private prisma: PrismaClient = prismaClient) {}
    /**
     * This query illustrates the pool related data that we need for each gauge
     * Ideally, we don't want to denormalize but how can we join validGauges with getPoolsForVotingList in an efficient way?
     */
    public async getPoolsForVotingList(poolIds: string[]): Promise<any> {
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

    async saveRootGauges(rootGauges: RootGauge[]) {
        const rootGaugesWithStakingId = Promise.all(
            rootGauges.map(async (rootGauge) => {
                rootGauge.stakingId = await this.findStakingId(rootGauge);
                return rootGauge;
            }),
        );

        return rootGaugesWithStakingId;
    }

    // TODO: Explain root gauge VS child gauge in a proper way
    findStakingId(rootGauge: RootGauge): Promise<Address> {
        const chain = rootGauge.network as Chain;
        if (chain !== 'MAINNET') {
            const recipient = rootGauge.recipient?.toLowerCase();
            return this.findStakingGaugeId(chain, recipient!);
        }
        return this.findStakingGaugeId(chain, rootGauge.gaugeAddress);
    }

    async findStakingGaugeId(chain: Chain, gaugeAddress: string) {
        let gauge = await this.prisma.prismaPoolStakingGauge.findFirstOrThrow({
            where: {
                chain: { equals: chain },
                gaugeAddress: { equals: gaugeAddress },
            },
            select: {
                id: true,
            },
        });
        return gauge.id as Address;
    }

    async saveRootGauge(rootGauge: RootGauge) {
        this.prisma.prismaRootStakingGauge.create({
            data: {
                id: rootGauge.gaugeAddress.toString(),
                chain: rootGauge.network,
                gaugeAddress: rootGauge.gaugeAddress.toString(),
                relativeWeight: rootGauge.relativeWeight.toString(),
                relativeWeightCap: rootGauge.relativeWeightCap,
                stakingId: rootGauge.stakingId!,
                status: rootGauge.isKilled ? 'ACTIVE' : 'KILLED',
            },
        });
    }
}

export const votingListService = new VotingListService();
