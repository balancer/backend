import { Chain } from '@prisma/client';
import { keyBy, mapValues, zipObject } from 'lodash';

import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber, Contract } from 'ethers';
import { Interface, formatEther } from 'ethers/lib/utils';
import { mainnetNetworkConfig } from '../network/mainnet';
import multicall3Abi from '../pool/lib/staking/abi/Multicall3.json';
import { Multicaller } from '../web3/multicaller';
import gaugeControllerAbi from './abi/gaugeController.json';
import rootGaugeAbi from './abi/rootGauge.json';
import { PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from '../../prisma/prisma-client';
import { gaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';

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

type SubGraphRootGauge = {
    gaugeAddress: string;
    chain: Chain;
    recipient?: string;
};

/**
 * Fetches root gauges combining data from onchain contracts and the mainnet subgraph
 * Saves root gauges in prisma DB
 */
export class RootGaugesRepository {
    constructor(private prisma: PrismaClient = prismaClient) {}

    async getRootGaugeAddresses(): Promise<string[]> {
        const totalGauges = Number(formatFixed(await this.getGaugeControllerContract().n_gauges()));
        return await this.fetchGaugeAddresses(totalGauges);
    }

    async fetchOnchainRootGauges(gaugeAddresses: string[]): Promise<RootGauge[]> {
        const totalGaugesTypes = Number(formatFixed(await this.getGaugeControllerContract().n_gauge_types()));

        const typeNames = await this.fetchTypeNames(totalGaugesTypes);

        const relativeWeights = await this.fetchRelativeWeights(gaugeAddresses);

        /*
            gauge_types are not reliable because they are manually input by Maxis
            We will use subgraph chain field instead
            However, we keep pulling this gauge_types cause they can be useful for debugging (when a root gauge is not found in the subgraph)
        */
        const gaugeTypeIndexes = await this.fetchGaugeTypes(gaugeAddresses);
        const gaugeTypes = mapValues(gaugeTypeIndexes, (type) => typeNames[Number(type)]);

        const isKilled = await this.fetchIsKilled(gaugeAddresses);

        const relativeWeightCaps = await this.fetchRelativeWeightCaps(gaugeAddresses);

        let rootGauges: RootGauge[] = [];
        gaugeAddresses.forEach((gaugeAddress) => {
            if (gaugeTypes[gaugeAddress] === 'Liquidity Mining Committee') return;
            rootGauges.push({
                gaugeAddress: gaugeAddress.toLowerCase(),
                network: this.toPrismaNetwork(gaugeTypes[gaugeAddress]),
                isKilled: isKilled[gaugeAddress],
                relativeWeight: relativeWeights[gaugeAddress],
                relativeWeightCap: relativeWeightCaps[gaugeAddress],
                isInSubgraph: false,
            });
        });

        return rootGauges;
    }

    async fetchRootGaugesFromSubgraph(onchainRootAddresses: string[]) {
        // This service only works with the mainnet subgraph, will return no root gauges for other chains
        const rootGauges = await gaugeSubgraphService.getRootGaugesForIds(onchainRootAddresses);

        const l2RootGauges: SubGraphRootGauge[] = rootGauges.map((gauge) => {
            return {
                gaugeAddress: gauge.id,
                chain: this.toPrismaNetwork(gauge.chain),
                recipient: gauge.recipient,
            } as SubGraphRootGauge;
        });

        const liquidityGauges = await gaugeSubgraphService.getLiquidityGaugesForIds(onchainRootAddresses);

        const mainnetRootGauges: SubGraphRootGauge[] = liquidityGauges.map((gauge) => {
            return {
                gaugeAddress: gauge.id,
                chain: Chain.MAINNET,
                recipient: undefined,
            } as SubGraphRootGauge;
        });

        return [...l2RootGauges, ...mainnetRootGauges];
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

    async findStakingId(rootGauge: RootGauge) {
        const chain = rootGauge.network as Chain;
        let mainnetGaugeAddressOrRecipient: string | undefined;
        if (chain === 'MAINNET') {
            mainnetGaugeAddressOrRecipient = rootGauge.gaugeAddress;
        } else {
            mainnetGaugeAddressOrRecipient = rootGauge.recipient?.toLowerCase();
        }

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
            // Only throw when root gauge is valid
            if (this.isValidForVotingList(rootGauge)) {
                const errorMessage = `RootGauge not found in PrismaPoolStakingGauge: ${JSON.stringify(rootGauge)}`;
                console.error(errorMessage);
                // TODO: replace by sentry error
                throw Error(errorMessage);
            }
            // Store without staking relation when missing stakingId and invalid for voting
            return undefined;
        }
        return gauge.id;
    }

    updateOnchainGaugesWithSubgraphData(onchainGauges: RootGauge[], subgraphGauges: SubGraphRootGauge[]) {
        const subgraphGaugesByAddress = keyBy(subgraphGauges, 'gaugeAddress');

        return onchainGauges.map((gauge) => {
            const rootGauge = gauge;
            const subGraphGauge = subgraphGaugesByAddress[gauge.gaugeAddress];
            if (subGraphGauge) {
                rootGauge.isInSubgraph = true;
                rootGauge.network = subGraphGauge.chain;
                rootGauge.recipient = subGraphGauge.recipient;
            }
            return rootGauge;
        });
    }

    /**
     * We need to use multicall3 with allowFailures=true because many of the root contracts do not have getRelativeWeightCap function defined
     */
    async fetchRelativeWeightCaps(gaugeAddresses: string[]) {
        const iRootGaugeController = new Interface(rootGaugeAbi);
        const allowFailures = true;

        const calls = gaugeAddresses.map((address) => [
            address,
            allowFailures,
            iRootGaugeController.encodeFunctionData('getRelativeWeightCap'),
        ]);

        const multicall = this.getMulticall3Contract();
        type Result = { success: boolean; returnData: string };
        const results: Result[] = await multicall.callStatic.aggregate3(calls);

        const relativeWeightCaps = results.map((result) =>
            result.success
                ? formatEther(iRootGaugeController.decodeFunctionResult('getRelativeWeightCap', result.returnData)[0])
                : undefined,
        );

        return zipObject(gaugeAddresses, relativeWeightCaps);
    }

    getMulticall3Contract() {
        return new Contract(mainnetNetworkConfig.data.multicall3, multicall3Abi, mainnetNetworkConfig.provider);
    }

    getGaugeControllerContract() {
        return new Contract(gaugeControllerAddress, gaugeControllerAbi, mainnetNetworkConfig.provider);
    }

    async fetchGaugeAddresses(totalGauges: number) {
        const multicaller = this.buildGaugeControllerMulticaller();
        this.generateGaugeIndexes(totalGauges).forEach((index) =>
            multicaller.call(`${index}`, gaugeControllerAddress, 'gauges', [index]),
        );

        const response = (await multicaller.execute()) as Record<string, string>;
        return Object.values(response).map((address) => address.toLowerCase());
    }

    async fetchTypeNames(totalTypes: number) {
        const multicaller = this.buildGaugeControllerMulticaller();

        this.generateGaugeIndexes(totalTypes).forEach((index) =>
            multicaller.call(`${index}`, gaugeControllerAddress, 'gauge_type_names', [index]),
        );

        const response = (await multicaller.execute()) as Record<string, string>;

        return Object.values(response);
    }

    async fetchGaugeTypes(gaugeAddresses: string[]) {
        const multicaller = this.buildGaugeControllerMulticaller();

        gaugeAddresses.forEach((address) =>
            multicaller.call(address, gaugeControllerAddress, 'gauge_types', [address]),
        );

        return (await multicaller.execute()) as Record<string, string>;
    }

    async fetchRelativeWeights(gaugeAddresses: string[]) {
        const multicaller = this.buildGaugeControllerMulticaller();
        gaugeAddresses.forEach((address) =>
            multicaller.call(address, gaugeControllerAddress, 'gauge_relative_weight', [address]),
        );

        const response = (await multicaller.execute()) as Record<string, BigNumber>;
        return mapValues(response, (value) => Number(formatEther(value)));
    }

    async fetchIsKilled(gaugeAddresses: string[]) {
        const rootGaugeMulticaller = new Multicaller(
            mainnetNetworkConfig.data.multicall,
            mainnetNetworkConfig.provider,
            rootGaugeAbi,
        );

        gaugeAddresses.forEach((address) => rootGaugeMulticaller.call(address, address, 'is_killed'));

        return (await rootGaugeMulticaller.execute()) as Record<string, boolean>;
    }

    buildGaugeControllerMulticaller() {
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

    generateGaugeIndexes(totalGauges: number) {
        return [...Array(totalGauges)].map((_, index) => index);
    }

    toPrismaNetwork(chainOrSubgraphNetwork: string): Chain {
        const network = chainOrSubgraphNetwork.toUpperCase();
        if (network === 'ETHEREUM') return Chain.MAINNET;
        if (network === 'POLYGONZKEVM') return Chain.ZKEVM;
        if (network === 'VEBAL') return Chain.MAINNET;
        if (!Object.keys(Chain).includes(network)) throw Error(`Network ${network} is not supported`);
        return network as Chain;
    }

    // A gauge should be included in the voting list when:
    //  - it is alive (not killed)
    //  - it is killed and has valid votes (the users should be able to reallocate votes)
    isValidForVotingList(rootGauge: { isKilled: boolean; relativeWeight: number }) {
        const isAlive = !rootGauge.isKilled;
        return isAlive || rootGauge.relativeWeight > 0;
    }
}
