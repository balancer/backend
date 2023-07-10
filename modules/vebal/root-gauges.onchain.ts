import { Chain } from '@prisma/client';
import { mapValues, zipObject } from 'lodash';

import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber, Contract } from 'ethers';
import { Interface, formatEther } from 'ethers/lib/utils';
import { mainnetNetworkConfig } from '../network/mainnet';
import multicall3Abi from '../pool/lib/staking/abi/Multicall3.json';
import { Multicaller } from '../web3/multicaller';
import gaugeControllerAbi from './abi/gaugeController.json';
import rootGaugeAbi from './abi/rootGauge.json';

const gaugeControllerAddress = mainnetNetworkConfig.data.gaugeControllerAddress!;

export type RootGauge = {
    gaugeAddress: string;
    network: Chain;
    isKilled: boolean;
    relativeWeight: number;
    relativeWeightCap?: string;
    recipient?: string;
    stakingId?: string;
    isInSubgraph: boolean;
};

export class OnChainRootGauges {
    async getRootGaugeAddresses(): Promise<string[]> {
        const totalGauges = Number(formatFixed(await getGaugeControllerContract().n_gauges()));
        return await fetchGaugeAddresses(totalGauges);
    }

    async fetchOnchainRootGauges(gaugeAddresses: string[]): Promise<RootGauge[]> {
        const totalGaugesTypes = Number(formatFixed(await getGaugeControllerContract().n_gauge_types()));

        const typeNames = await fetchTypeNames(totalGaugesTypes);

        const relativeWeights = await fetchRelativeWeights(gaugeAddresses);

        /*
            gauge_types are not reliable because they are manually input by Maxis
            We will use subgraph chain field instead
            However, we keep pulling this gauge_types cause they can be useful for debugging (when a root gauge is not found in the subgraph)
        */
        const gaugeTypeIndexes = await fetchGaugeTypes(gaugeAddresses);
        const gaugeTypes = mapValues(gaugeTypeIndexes, (type) => typeNames[Number(type)]);

        const isKilled = await fetchIsKilled(gaugeAddresses);

        const relativeWeightCaps = await fetchRelativeWeightCaps(gaugeAddresses);

        let rootGauges: RootGauge[] = [];
        gaugeAddresses.forEach((gaugeAddress) => {
            if (gaugeTypes[gaugeAddress] === 'Liquidity Mining Committee') return;
            rootGauges.push({
                gaugeAddress: gaugeAddress.toLowerCase(),
                network: toPrismaNetwork(gaugeTypes[gaugeAddress]),
                isKilled: isKilled[gaugeAddress],
                relativeWeight: relativeWeights[gaugeAddress],
                relativeWeightCap: relativeWeightCaps[gaugeAddress],
                isInSubgraph: false,
            });
        });

        return rootGauges;
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

// A gauge should be included in the voting list when:
//  - it is alive (not killed)
//  - it is killed and has valid votes (the users should be able to reallocate votes)
// export function isValidForVotingList(rootGauge: { isKilled: boolean; relativeWeight: number }) {
export function isValidForVotingList(rootGauge: { isKilled: boolean; relativeWeight: number }) {
    const isAlive = !rootGauge.isKilled;
    return isAlive || rootGauge.relativeWeight > 0;
}

async function fetchGaugeAddresses(totalGauges: number) {
    const multicaller = buildGaugeControllerMulticaller();
    generateGaugeIndexes(totalGauges).forEach((index) =>
        multicaller.call(`${index}`, gaugeControllerAddress, 'gauges', [index]),
    );

    const response = (await multicaller.execute()) as Record<string, string>;
    return Object.values(response).map((address) => address.toLowerCase());
}

async function fetchTypeNames(totalTypes: number) {
    const multicaller = buildGaugeControllerMulticaller();

    generateGaugeIndexes(totalTypes).forEach((index) =>
        multicaller.call(`${index}`, gaugeControllerAddress, 'gauge_type_names', [index]),
    );

    const response = (await multicaller.execute()) as Record<string, string>;

    return Object.values(response);
}

async function fetchGaugeTypes(gaugeAddresses: string[]) {
    const multicaller = buildGaugeControllerMulticaller();

    gaugeAddresses.forEach((address) => multicaller.call(address, gaugeControllerAddress, 'gauge_types', [address]));

    return (await multicaller.execute()) as Record<string, string>;
}

async function fetchRelativeWeights(gaugeAddresses: string[]) {
    const multicaller = buildGaugeControllerMulticaller();
    gaugeAddresses.forEach((address) =>
        multicaller.call(address, gaugeControllerAddress, 'gauge_relative_weight', [address]),
    );

    const response = (await multicaller.execute()) as Record<string, BigNumber>;
    return mapValues(response, (value) => Number(formatEther(value)));
}

async function fetchIsKilled(gaugeAddresses: string[]) {
    const rootGaugeMulticaller = new Multicaller(
        mainnetNetworkConfig.data.multicall,
        mainnetNetworkConfig.provider,
        rootGaugeAbi,
    );

    gaugeAddresses.forEach((address) => rootGaugeMulticaller.call(address, address, 'is_killed'));

    return (await rootGaugeMulticaller.execute()) as Record<string, boolean>;
}

/**
 * We need to use multicall3 with allowFailures=true because many of the root contracts do not have getRelativeWeightCap function defined
 */
export async function fetchRelativeWeightCaps(gaugeAddresses: string[]) {
    const iRootGaugeController = new Interface(rootGaugeAbi);
    const allowFailures = true;

    const calls = gaugeAddresses.map((address) => [
        address,
        allowFailures,
        iRootGaugeController.encodeFunctionData('getRelativeWeightCap'),
    ]);

    const multicall = getMulticall3Contract();
    type Result = { success: boolean; returnData: string };
    const results: Result[] = await multicall.callStatic.aggregate3(calls);

    const relativeWeightCaps = results.map((result) =>
        result.success
            ? formatEther(iRootGaugeController.decodeFunctionResult('getRelativeWeightCap', result.returnData)[0])
            : undefined,
    );

    return zipObject(gaugeAddresses, relativeWeightCaps);
}

export function getMulticall3Contract() {
    return new Contract(mainnetNetworkConfig.data.multicall3, multicall3Abi, mainnetNetworkConfig.provider);
}

export function getGaugeControllerContract() {
    return new Contract(gaugeControllerAddress, gaugeControllerAbi, mainnetNetworkConfig.provider);
}

function buildGaugeControllerMulticaller() {
    /*
        gauge_relative_weight has 2 overridden instances with different amounts of inputs which causes problems with ethers
        We apply a filter to exclude the function that we are not using
    */
    const filteredGaugeControllerAbi = gaugeControllerAbi.filter((item) => {
        return !(item.type === 'function' && item.name === 'gauge_relative_weight' && item.inputs.length > 1);
    });

    return new Multicaller(
        mainnetNetworkConfig.data.multicall,
        mainnetNetworkConfig.provider,
        filteredGaugeControllerAbi,
    );
}
