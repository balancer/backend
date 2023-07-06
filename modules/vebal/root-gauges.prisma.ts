import { Chain, PrismaClient } from '@prisma/client';
import { Address } from 'viem';
import { prisma as prismaClient } from '../../prisma/prisma-client';
import { RootGauge, isValidForVotingList } from './root-gauges.onchain';

export class PrismaRootGauges {
    constructor(private prisma: PrismaClient = prismaClient) {}

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

    async saveRootGauge(rootGauge: RootGauge) {
        try {
            await this.prisma.prismaRootStakingGauge.create({
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
        } catch (error) {
            console.error('Error saving root gauge: ', rootGauge);
            throw error;
        }
    }
}

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
}
