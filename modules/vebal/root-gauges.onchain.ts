import { Chain } from '@prisma/client';
import { mapValues, pickBy, zipObject } from 'lodash';
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
};

export class OnChainRootGauges {
    constructor(
        private publicClient: PublicClient = mainnetNetworkConfig.publicClient!,
        private readContract = publicClient.readContract,
    ) {}

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
     *
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
        // const l2Addresses = Object.keys(pickBy(gaugeTypes, (type) => type !== 'Ethereum')) as Address[];
        // const recipients = (await this.multicallRootGauges(l2Addresses, 'getRecipient'));
        const recipients = await this.multicallRootGauges(gaugeAddresses, 'getRecipient');

        let rootGauges: RootGauge[] = [];
        gaugeAddresses.forEach((gaugeAddress) => {
            const relativeWeight = relativeWeightCaps[gaugeAddress];
            if (gaugeTypes[gaugeAddress] === 'Liquidity Mining Committee') return;
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
