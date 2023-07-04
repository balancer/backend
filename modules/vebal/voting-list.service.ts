import { Chain, PrismaClient } from '@prisma/client';
import { Address, PublicClient } from 'viem';
import { prisma as prismaClient } from '../../prisma/prisma-client';

import { OnChainRootGauges, RootGauge, isValidForVotingList, throwIfMissingRootGaugeData } from './root-gauges.onchain';
import { fetchRootGaugesFromSubgraph, updateOnchainGaugesWithSubgraphData } from './root-gauges.subgraph';
import { mainnetNetworkConfig } from '../network/mainnet';

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

    async deleteRootGauges() {
        await this.prisma.prismaRootStakingGauge.deleteMany();
    }

    async saveRootGauges(rootGauges: RootGauge[]) {
        const rootGaugesWithStakingId = Promise.all(
            rootGauges.map(async (rootGauge) => {
                const stakingId = await this.findStakingId(rootGauge);
                rootGauge.stakingId = stakingId;
                await this.saveRootGauge(rootGauge);
                return rootGauge;
            }),
        );

        return rootGaugesWithStakingId;
    }

    async fetchRootGauges(testHttpClient: PublicClient) {
        const service = new OnChainRootGauges(testHttpClient);

        const onchainRootAddresses: string[] = (await service.getRootGaugeAddresses()).map((address) =>
            address.toLowerCase(),
        );

        const subgraphGauges = await fetchRootGaugesFromSubgraph(onchainRootAddresses);

        const onchainGauges = await service.fetchOnchainRootGauges(onchainRootAddresses as Address[]);

        const rootGauges = updateOnchainGaugesWithSubgraphData(onchainGauges, subgraphGauges);

        throwIfMissingRootGaugeData(rootGauges);

        return rootGauges;
    }

    async fetchRootGauges2(testHttpClient: PublicClient, onchainRootAddresses: string[]) {
        const service = new OnChainRootGauges(testHttpClient);

        const subgraphGauges = await fetchRootGaugesFromSubgraph(onchainRootAddresses);

        const onchainGauges = await service.fetchOnchainRootGauges(onchainRootAddresses as Address[]);

        const rootGauges = updateOnchainGaugesWithSubgraphData(onchainGauges, subgraphGauges);

        throwIfMissingRootGaugeData(rootGauges);

        return rootGauges;
    }

    async findStakingId(rootGauge: RootGauge) {
        const chain = rootGauge.network as Chain;
        let mainnetGaugeAddressOrRecipient: string | undefined;
        if (chain === 'MAINNET') {
            mainnetGaugeAddressOrRecipient = rootGauge.gaugeAddress;
        } else {
            mainnetGaugeAddressOrRecipient = rootGauge.recipient?.toLowerCase();
        }

        const hardcodedStakingAddress = findHardcodedStakingAddress(mainnetGaugeAddressOrRecipient);
        if (hardcodedStakingAddress) return hardcodedStakingAddress;

        let gauge = await this.prisma.prismaPoolStakingGauge.findFirst({
            where: {
                chain: { equals: chain },
                gaugeAddress: { equals: mainnetGaugeAddressOrRecipient },
            },
            select: {
                id: true,
            },
        });

        if (!gauge) {
            if (isValidForVotingList(rootGauge)) {
                const errorMessage = `RootGauge not found in PrismaPoolStakingGauge: ${JSON.stringify(rootGauge)}`;
                console.error(errorMessage);
                // Only throw when root gauge is valid
                throw Error(errorMessage);
            }
            // Store without staking relation when missing stakingId and invalid for voting
            return undefined;
        }
        return gauge.id as Address;
    }

    async saveRootGauge(rootGauge: RootGauge) {
        await this.prisma.prismaRootStakingGauge.deleteMany();

        const result = await this.prisma.prismaRootStakingGauge.create({
            data: {
                id: rootGauge.gaugeAddress.toString(),
                chain: rootGauge.network,
                gaugeAddress: rootGauge.gaugeAddress.toString(),
                relativeWeight: rootGauge.relativeWeight.toString(),
                relativeWeightCap: rootGauge.relativeWeightCap,
                stakingId: rootGauge.stakingId!,
                status: rootGauge.isKilled ? 'KILLED' : 'ACTIVE',
            },
        });
        // console.log('result of saving root gauge: ', result);
    }
}

export const votingListService = new VotingListService();

function findHardcodedStakingAddress(gaugeAddress: string | undefined) {
    if (!gaugeAddress) return '';
    //TODO: How do we maintain this address changes in the future??
    // veUSH
    if (gaugeAddress === '0x5b79494824bc256cd663648ee1aad251b32693a9')
        return '0xc85d90dec1e12edee418c445b381e7168eb380ab';
    // veBAL
    if (gaugeAddress === '0xb78543e00712c3abba10d0852f6e38fde2aaba4d')
        // NO Staking gauge for veBal pool (0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014)
        return '';

    // '0xf8C85bd74FeE26831336B51A90587145391a27Ba' has network type Ethererum when it is Gnosis
}
