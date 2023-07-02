import { mapValues, pickBy, zipObject } from 'lodash';
import { Address, PublicClient, formatUnits } from 'viem';
import { prisma as prismaClient } from '../../prisma/prisma-client';
import { Chain, PrismaClient } from '@prisma/client';

import { mainnetNetworkConfig } from '../network/mainnet';
import { gaugeControllerAbi } from './abi/gaugeController.abi';
import { rootGaugeAbi } from './abi/rootGauge.abi';

const gaugeControllerContract = {
    address: mainnetNetworkConfig.data.gaugeControllerAddress!,
    abi: gaugeControllerAbi,
} as const;

type RootGauge = {
    id?: Address;
    gaugeAddress: Address;
    network: Chain;
    isKilled: boolean;
    relativeWeight: number;
    relativeWeightCap?: string;
    recipient?: string;
};

export function toPrismaNetwork(onchainNetwork: string): Chain {
    const network = onchainNetwork.toUpperCase();
    if (network === 'ETHEREUM') return Chain.MAINNET;
    if (!Object.keys(Chain).includes(network)) throw Error(`Network ${network} is not supported`);
    return network as Chain;
}
export class VotingListService {
    constructor(
        private publicClient: PublicClient = mainnetNetworkConfig.publicClient!,
        private prisma: PrismaClient = prismaClient,
        private readContract = publicClient.readContract,
    ) {}
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
                type: true, // TODO: Types are different than the original subgraph ones cause they are changed in mapSubgraphPoolTypeToPoolType (do we add a new column to prismaPool to store the original type?)
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
        // console.log(rootGauges);
        const rootGauge = rootGauges[0];
        // rootGauges.forEach(async (rootGauge) => {
        rootGauge.id = await this.findStakingId(rootGauge);
        return rootGauges;
        // });
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

    //TODO: Move to repository Staking Gauge Repository?
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

    async getRootGaugeAddresses(): Promise<Address[]> {
        const totalGauges = Number(
            await this.readContract({
                ...gaugeControllerContract,
                functionName: 'n_gauges',
            }),
        );
        return this.publicClient.multicall({
            allowFailure: false,
            contracts: this.gaugeControllerCallsByIndex(totalGauges, 'gauges'),
        });
    }

    /**
     *
     * This is the first proof of concept using viem's multicall
     * It contains ad-hoc helpers to make the code easier in this concrete scenario but in the future we will try to create a more generic
     * multicaller implementation to generalize any multicall flow
     */
    async fetchOnchainRootGauges(gaugeAddresses: Address[]): Promise<RootGauge[]> {
        const totalGaugesTypes = Number(
            await this.readContract({
                ...gaugeControllerContract,
                functionName: 'n_gauge_types',
            }),
        );

        const typeNames = await this.publicClient.multicall({
            allowFailure: false,
            contracts: this.gaugeControllerCallsByIndex(totalGaugesTypes, 'gauge_type_names'),
        });

        const relativeWeights = await this.multicallGaugeController(gaugeAddresses, 'gauge_relative_weight');

        const gaugeTypeIndexes = await this.multicallGaugeController(gaugeAddresses, 'gauge_types');
        const gaugeTypes = mapValues(gaugeTypeIndexes, (type) => typeNames[Number(type)]);

        const isKilled = await this.multicallRootGauges(gaugeAddresses, 'is_killed');

        const relativeWeightCapsWithFailures = await this.multicallRootGaugesAllowingFailures(
            gaugeAddresses,
            'getRelativeWeightCap',
        );
        const relativeWeightCaps = mapValues(relativeWeightCapsWithFailures, (r) => r.result);

        // Ethereum root gauges do not have getRecipient
        const l2Addresses = Object.keys(pickBy(gaugeTypes, (type) => type !== 'Ethereum')) as Address[];
        const recipients = (await this.multicallRootGauges(l2Addresses, 'getRecipient')) as Record<string, string>;

        let rootGauges: RootGauge[] = [];
        gaugeAddresses.forEach((gaugeAddress) => {
            const relativeWeight = relativeWeightCaps[gaugeAddress];
            rootGauges.push({
                gaugeAddress: gaugeAddress.toLowerCase() as Address, // Should we lowerCase here? (database stores lowercase in other tables so I guess yes)
                network: toPrismaNetwork(gaugeTypes[gaugeAddress]),
                isKilled: isKilled[gaugeAddress],
                relativeWeight: Number(relativeWeights[gaugeAddress]),
                relativeWeightCap: relativeWeight ? formatUnits(relativeWeight, 18) : undefined,
                recipient: recipients[gaugeAddress]?.toLowerCase(),
            });
        });

        console.log('ROWS: ', rootGauges);
        return rootGauges;
    }

    gaugeControllerCallsByIndex<TFunctionName extends string>(totalCalls: number, functionName: TFunctionName) {
        return generateGaugeIndexes(totalCalls).map(
            (index) =>
                ({
                    ...gaugeControllerContract,
                    functionName,
                    args: [BigInt(index)],
                } as const),
        );
    }

    gaugeControllerCallsByAddress<TFunctionName extends string>(
        gaugeAddresses: Address[],
        functionName: TFunctionName,
    ) {
        return gaugeAddresses.map(
            (address) =>
                ({
                    ...gaugeControllerContract,
                    functionName,
                    args: [address],
                } as const),
        );
    }

    async multicallGaugeController<TFunctionName extends string>(
        gaugeAddresses: Address[],
        functionName: TFunctionName,
    ) {
        const results = await this.publicClient.multicall({
            allowFailure: false,
            // See https://github.com/wagmi-dev/viem/discussions/821
            // @ts-ignore
            contracts: this.gaugeControllerCallsByAddress(gaugeAddresses, functionName),
        });
        return zipObject(gaugeAddresses, results) as Record<Address, typeof results[number]>;
    }

    async multicallRootGauges<TFunctionName extends string>(
        rootGaugeAddresses: Address[],
        functionName: TFunctionName,
    ) {
        const contracts = rootGaugeAddresses.map((address) => ({
            address,
            abi: rootGaugeAbi,
            functionName,
        }));
        const results = await this.publicClient.multicall({
            allowFailure: false,
            // See https://github.com/wagmi-dev/viem/discussions/821
            // @ts-ignore
            contracts,
        });
        return zipObject(rootGaugeAddresses, results) as Record<Address, typeof results[number]>;
    }

    async multicallRootGaugesAllowingFailures<TFunctionName extends string>(
        rootGaugeAddresses: Address[],
        functionName: TFunctionName,
    ) {
        const contracts = rootGaugeAddresses.map((address) => ({
            address,
            abi: rootGaugeAbi,
            functionName,
        }));
        const results = await this.publicClient.multicall({
            allowFailure: true,
            // See https://github.com/wagmi-dev/viem/discussions/821
            // @ts-ignore
            contracts,
        });
        return zipObject(rootGaugeAddresses, results) as Record<Address, typeof results[number]>;
    }
}

export const votingListService = new VotingListService();

function generateGaugeIndexes(totalGauges: number) {
    return [...Array(totalGauges)].map((_, index) => index);
}
