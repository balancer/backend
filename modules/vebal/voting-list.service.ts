import { mapValues, pickBy, zipObject } from 'lodash';
import { Address, PublicClient, formatUnits } from 'viem';
import { prisma } from '../../prisma/prisma-client';

import { mainnetNetworkConfig } from '../network/mainnet';
import { gaugeControllerAbi } from './abi/gaugeController.abi';
import { rootGaugeAbi } from './abi/rootGauge.abi';

const gaugeControllerContract = {
    address: mainnetNetworkConfig.data.gaugeControllerAddress!,
    abi: gaugeControllerAbi,
} as const;

export class VotingListService {
    constructor(
        private publicClient: PublicClient = mainnetNetworkConfig.publicClient!,
        private readContract = publicClient.readContract,
    ) {}
    /**
     * This query illustrates the pool related data that we need for each gauge
     * Ideally, we don't want to denormalize but how can we join validGauges with getPoolsForVotingList in an efficient way?
     */
    public async getPoolsForVotingList(poolIds: string[]): Promise<any> {
        let pools = await prisma.prismaPool.findMany({
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
    async generateRootGaugeRows(gaugeAddresses: Address[]) {
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

        type RootGaugeRow = {
            gaugeAddress: Address;
            network: string;
            isKilled: boolean;
            relativeWeight: number;
            relativeWeightCap?: string;
            recipient?: string;
        };
        let rows: RootGaugeRow[] = [];
        gaugeAddresses.forEach((gaugeAddress) => {
            const relativeWeight = relativeWeightCaps[gaugeAddress];
            rows.push({
                gaugeAddress,
                network: gaugeTypes[gaugeAddress],
                isKilled: isKilled[gaugeAddress],
                relativeWeight: Number(relativeWeights[gaugeAddress]),
                relativeWeightCap: relativeWeight ? formatUnits(relativeWeight, 18) : undefined,
                recipient: recipients[gaugeAddress],
            });
        });

        console.log('ROWS: ', rows);
        return rows;
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
