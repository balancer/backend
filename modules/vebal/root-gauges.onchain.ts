import { Chain } from '@prisma/client';
import { mapValues, zipObject } from 'lodash';
import { Address, PublicClient, formatUnits } from 'viem';

import { mainnetNetworkConfig } from '../network/mainnet';
import { gaugeControllerAbi } from './abi/gaugeController.abi';
import { rootGaugeAbi } from './abi/rootGauge.abi';

const gaugeControllerContract = {
    address: mainnetNetworkConfig.data.gaugeControllerAddress!,
    abi: gaugeControllerAbi,
} as const;

export type RootGauge = {
    gaugeAddress: Address;
    network: Chain;
    isKilled: boolean;
    relativeWeight: number;
    relativeWeightCap?: string;
    recipient?: string;
    stakingId?: Address;
    isInSubgraph: boolean;
};

/**
 *
 * This is the first proof of concept using viem's multicall
 * It contains ad-hoc helpers to make the code easier in this concrete scenario but in the future we will try to create a more generic
 * multicaller implementation to generalize any multicall flow
 *
 */
export class OnChainRootGauges {
    constructor(
        private publicClient: PublicClient = mainnetNetworkConfig.publicClient!,
        private readContract = publicClient.readContract,
    ) {}

    async getRootGaugeAddresses(): Promise<string[]> {
        const totalGauges = Number(
            await this.readContract({
                ...gaugeControllerContract,
                functionName: 'n_gauges',
            }),
        );
        const addresses = await this.publicClient.multicall({
            allowFailure: false,
            contracts: this.gaugeControllerCallsByIndex(totalGauges, 'gauges'),
        });

        return addresses.map((address) => address.toLowerCase());
    }

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

        /*
            gauge_types are not reliable because they are manually input by Maxis
            We will use subgraph chain field instead
            However, we keep pulling this gauge_types cause they can be useful for debugging (when a root gauge is not found in the subgraph)
        */
        const gaugeTypeIndexes = await this.multicallGaugeController(gaugeAddresses, 'gauge_types');
        const gaugeTypes = mapValues(gaugeTypeIndexes, (type) => typeNames[Number(type)]);

        const isKilled = await this.multicallRootGauges(gaugeAddresses, 'is_killed');

        const relativeWeightCapsWithFailures = await this.multicallRootGaugesAllowingFailures(
            gaugeAddresses,
            'getRelativeWeightCap',
        );
        const relativeWeightCaps = mapValues(relativeWeightCapsWithFailures, (r) => r.result);

        let rootGauges: RootGauge[] = [];
        gaugeAddresses.forEach((gaugeAddress) => {
            const relativeWeight = relativeWeightCaps[gaugeAddress];
            if (gaugeTypes[gaugeAddress] === 'Liquidity Mining Committee') return;
            rootGauges.push({
                gaugeAddress: gaugeAddress.toLowerCase() as Address,
                network: toPrismaNetwork(gaugeTypes[gaugeAddress]),
                isKilled: isKilled[gaugeAddress],
                relativeWeight: Number(relativeWeights[gaugeAddress]),
                relativeWeightCap: relativeWeight ? formatUnits(relativeWeight, 18) : undefined,
                isInSubgraph: false,
            });
        });

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

export function toPrismaNetwork(onchainNetwork: string): Chain {
    const network = onchainNetwork.toUpperCase();
    if (network === 'ETHEREUM') return Chain.MAINNET;
    if (network === 'VEBAL') return Chain.MAINNET;
    if (!Object.keys(Chain).includes(network)) throw Error(`Network ${network} is not supported`);
    return network as Chain;
}

function generateGaugeIndexes(totalGauges: number) {
    return [...Array(totalGauges)].map((_, index) => index);
}

export const veGauges = [
    // They are not listed in the subgraph but we do have pool and staking info stored
    '0x5b79494824bc256cd663648ee1aad251b32693a9', // veUSH
    '0xb78543e00712c3abba10d0852f6e38fde2aaba4d', // veBAL
    // We have its pool 0x9232a548dd9e81bac65500b5e0d918f8ba93675c000200000000000000000423 but not staking relation in PrismaPoolStaking
    // We include it in specialAddresses cause we do not have its pool
    '0x56124eb16441a1ef12a4ccaeabdd3421281b795a', // veLIT
];

// TODO: Find a fix for these pools: they fail because they are valid for voting but no PrimaPoolStakingGauge relation was found
export const specialRootGaugeAddresses = [
    // veLIT
    '0x56124eb16441a1ef12a4ccaeabdd3421281b795a',

    // Balancer USDC/WETH/L Gauge Deposit
    // https://etherscan.io/address/0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c#readContract
    // Valid root gauge without Staking relation (MAINNET??)
    '0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c',

    // TWAMM (Mainnet) Root gauges do exist but poolId 0x6910c4e32d425a834fb61e983c8083a84b0ebd01000200000000000000000532 does not exist in PrismaPool
    '0xb5bd58c733948e3d65d86ba9604e06e5da276fd1',

    // ARBITRUM Killed root gauge that shares staking with '0xd758454bdf4df7ad85f7538dc9742648ef8e6d0a' (was failing due to unique constraint)
    '0x3f829a8303455cb36b7bcf3d1bdc18d5f6946aea',
];

// A gauge should be included in the voting list when:
//  - it is alive (not killed)
//  - it is killed and has valid votes (the users should be able to reallocate votes)
// export function isValidForVotingList(rootGauge: { isKilled: boolean; relativeWeight: number }) {
export function isValidForVotingList(rootGauge: { isKilled: boolean; relativeWeight: number }) {
    const isAlive = !rootGauge.isKilled;
    return isAlive || rootGauge.relativeWeight > 0;
}
