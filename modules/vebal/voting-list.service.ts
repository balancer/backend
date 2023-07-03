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
        await this.prisma.prismaRootStakingGauge.deleteMany();

        const rootGaugesWithStakingId = Promise.all(
            rootGauges.map(async (rootGauge) => {
                rootGauge.stakingId = await this.findStakingId(rootGauge);
                rootGauge.network = Chain.GNOSIS;
                await this.saveRootGauge(rootGauge);
                return rootGauge;
            }),
        );

        return rootGaugesWithStakingId;
    }

    // TODO: Explain root gauge VS child gauge in a proper way
    async findStakingId(rootGauge: RootGauge) {
        const chain = rootGauge.network as Chain;
        const recipient = rootGauge.recipient?.toLowerCase();
        if (chain !== 'MAINNET') {
            if (!recipient)
                throw Error(`${chain} root gauge with address ${rootGauge.gaugeAddress} does not have recipient`);
            return this.findStakingGaugeId(chain, recipient!);
        }

        try {
            const address = await this.findStakingGaugeId(chain, rootGauge.gaugeAddress);
            return address;
        } catch {
            // retry with GNOSIS
            console.log('recipient AMIGO', recipient);
            if (!recipient)
                throw Error(`${chain} root gauge with address ${rootGauge.gaugeAddress} does not have recipient`);
            return this.findStakingGaugeInGnosis(rootGauge.gaugeAddress, recipient!);
        }
    }

    async findStakingGaugeId(chain: Chain, gaugeAddress: string) {
        const hardcodedStakingAddress = findHardcodedStakingAddress(gaugeAddress);
        if (hardcodedStakingAddress) return hardcodedStakingAddress;

        let gauge = await this.prisma.prismaPoolStakingGauge.findFirst({
            where: {
                chain: { equals: chain },
                gaugeAddress: { equals: gaugeAddress },
            },
            select: {
                id: true,
            },
        });
        if (!gauge)
            throw Error(
                `${chain} root gauge with address ${gaugeAddress} not found in PrismaPoolStakingGauge (tried both mainnet and gnosis)`,
            );
        return gauge.id as Address;
    }

    /** Gnosis root gauges are stored with network "Ethereum" on chain so we need to explicitly change the network to GNOSIS and retry */
    async findStakingGaugeInGnosis(gaugeAddress: string, recipient: string) {
        try {
            const stakingAddress = await this.findStakingGaugeId(Chain.GNOSIS, recipient);
            return stakingAddress;
        } catch {
            throw Error(`Mainnet root gauge with address ${gaugeAddress} not found in PrismaPoolStakingGauge`);
        }
    }

    async saveRootGauge(rootGauge: RootGauge) {
        // await this.prisma.prismaRootStakingGauge.deleteMany();

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
        console.log('result of saving root gauge: ', result);
    }
}

export const votingListService = new VotingListService();

function findHardcodedStakingAddress(gaugeAddress: string) {
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
