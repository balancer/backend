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

export function getMulticall3Contract() {
    return new Contract(mainnetNetworkConfig.data.multicall3, multicall3Abi, mainnetNetworkConfig.provider);
}

export function getGaugeControllerContract() {
    return new Contract(gaugeControllerAddress, gaugeControllerAbi, mainnetNetworkConfig.provider);
}

/**
 *
 * This is the first proof of concept using viem's multicall
 * It contains ad-hoc helpers to make the code easier in this concrete scenario but in the future we will try to create a more generic
 * multicaller implementation to generalize any multicall flow
 *
 */
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

export const veGauges = [
    // They are not listed in the subgraph but we do have pool and staking info stored
    '0x5b79494824bc256cd663648ee1aad251b32693a9', // veUSH
    '0xb78543e00712c3abba10d0852f6e38fde2aaba4d', // veBAL
    '0x56124eb16441a1ef12a4ccaeabdd3421281b795a', // veLIT
];

// TODO: Find a fix for these pools: they fail because they are valid for voting but no PrimaPoolStakingGauge relation was found
export const specialRootGaugeAddresses = [
    ...veGauges,

    // Balancer USDC/WETH/L Gauge Deposit
    // https://etherscan.io/address/0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c#readContract
    // Valid root gauge without Staking relation (MAINNET??)
    '0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c',

    // TWAMM (Mainnet) Root gauges do exist but poolId 0x6910c4e32d425a834fb61e983c8083a84b0ebd01000200000000000000000532 does not exist in PrismaPool
    '0xb5bd58c733948e3d65d86ba9604e06e5da276fd1',

    // ARBITRUM Killed root gauge that shares staking with '0xd758454bdf4df7ad85f7538dc9742648ef8e6d0a' (was failing due to unique constraint)
    '0x3f829a8303455cb36b7bcf3d1bdc18d5f6946aea',

    '0xf0d887c1f5996c91402eb69ab525f028dd5d7578',
];

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
async function fetchRelativeWeightCaps(gaugeAddresses: string[]) {
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
