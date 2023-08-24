import { Chain } from '@prisma/client';
import { keyBy, mapValues } from 'lodash';

import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber, Contract } from 'ethers';
import { formatEther } from 'ethers/lib/utils';
import { mainnetNetworkConfig } from '../network/mainnet';
import gaugeControllerAbi from './abi/gaugeController.json';
import gaugeControllerHelperAbi from './abi/gaugeControllerHelper.json';
import rootGaugeAbi from './abi/rootGauge.json';
import { PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from '../../prisma/prisma-client';
import { gaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { v1RootGaugeRecipients } from './special-pools/streamer-v1-gauges';
import { Multicaller3 } from '../web3/multicaller3';
import { networkContext } from '../network/network-context.service';

const gaugeControllerAddress = mainnetNetworkConfig.data.gaugeControllerAddress!;
// Helper contract that wraps gaugeControllerAddress contract to allow checkpointing and getting the updated relative weight
const gaugeControllerHelperAddress = mainnetNetworkConfig.data.gaugeControllerHelperAddress!;

export type VotingGauge = {
    gaugeAddress: string;
    network: Chain;
    isKilled: boolean;
    relativeWeight: number;
    relativeWeightCap?: string;
    recipient?: string;
    stakingGaugeId?: string;
    isInSubgraph: boolean;
    addedTimestamp?: number;
};

type SubGraphGauge = {
    gaugeAddress: string;
    chain: Chain;
    recipient?: string;
    addedTimestamp?: number;
};

/**
 * Fetches voting gauges combining data from onchain contracts and the mainnet subgraph
 * Saves voting gauges in prisma DB
 */
export class VotingGaugesRepository {
    constructor(private prisma: PrismaClient = prismaClient) {}

    async getVotingGaugeAddresses(): Promise<string[]> {
        const totalGauges = Number(formatFixed(await this.getGaugeControllerContract().n_gauges()));
        return await this.fetchGaugeAddresses(totalGauges);
    }

    async fetchOnchainVotingGauges(gaugeAddresses: string[]): Promise<VotingGauge[]> {
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

        let votingGauges: VotingGauge[] = [];
        gaugeAddresses.forEach((gaugeAddress) => {
            if (gaugeTypes[gaugeAddress] === 'Liquidity Mining Committee') return;
            votingGauges.push({
                gaugeAddress: gaugeAddress.toLowerCase(),
                network: this.toPrismaNetwork(gaugeTypes[gaugeAddress]),
                isKilled: isKilled[gaugeAddress],
                relativeWeight: relativeWeights[gaugeAddress],
                relativeWeightCap: relativeWeightCaps[gaugeAddress]
                    ? formatEther(relativeWeightCaps[gaugeAddress]!)
                    : undefined,
                isInSubgraph: false,
            });
        });

        return votingGauges;
    }

    async fetchVotingGaugesFromSubgraph(onchainAddresses: string[]) {
        // This service only works with the mainnet subgraph, will return no voting gauges for other chains
        const rootGauges = await gaugeSubgraphService.getRootGaugesForIds(onchainAddresses);

        const l2RootGauges: SubGraphGauge[] = rootGauges.map((gauge) => {
            return {
                gaugeAddress: gauge.id,
                chain: this.toPrismaNetwork(gauge.chain),
                recipient: gauge.recipient,
                addedTimestamp: gauge.gauge?.addedTimestamp,
            } as SubGraphGauge;
        });

        const liquidityGauges = await gaugeSubgraphService.getLiquidityGaugesForIds(onchainAddresses);

        const mainnetLiquidityGauges: SubGraphGauge[] = liquidityGauges.map((gauge) => {
            return {
                gaugeAddress: gauge.id,
                chain: Chain.MAINNET,
                recipient: undefined,
                addedTimestamp: gauge.gauge?.addedTimestamp,
            } as SubGraphGauge;
        });

        return [...l2RootGauges, ...mainnetLiquidityGauges];
    }

    async deleteVotingGauges() {
        await this.prisma.prismaVotingGauge.deleteMany();
    }

    async saveVotingGauges(votingGauges: VotingGauge[]) {
        const votingGaugesWithStakingGaugeId = Promise.all(
            votingGauges.map(async (gauge) => {
                const stakingId = await this.findStakingGaugeId(gauge);
                gauge.stakingGaugeId = stakingId;
                await this.saveVotingGauge(gauge);
                return gauge;
            }),
        );

        return votingGaugesWithStakingGaugeId;
    }

    async saveVotingGauge(gauge: VotingGauge) {
        if (!this.isValidForVotingList(gauge)) return;
        try {
            const upsertFields = {
                id: gauge.gaugeAddress,
                chain: gauge.network,
                gaugeAddress: gauge.gaugeAddress,
                relativeWeight: gauge.relativeWeight.toString(),
                relativeWeightCap: gauge.relativeWeightCap,
                stakingGaugeId: gauge.stakingGaugeId!,
                status: gauge.isKilled ? 'KILLED' : 'ACTIVE',
                addedTimestamp: gauge.addedTimestamp,
            } as const;

            await this.prisma.prismaVotingGauge.upsert({
                where: { id_chain: { id: gauge.gaugeAddress, chain: gauge.network } },
                create: upsertFields,
                update: upsertFields,
            });
        } catch (error) {
            console.error('Error saving voting gauge: ', gauge, error);
            throw error;
        }
    }

    async findStakingGaugeId(votingGauge: VotingGauge) {
        const chain = votingGauge.network as Chain;
        let mainnetGaugeAddressOrRecipient = this.getMatchingStakingGaugeAddress(chain, votingGauge);

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
            // Only throw when voting gauge is valid
            if (this.isValidForVotingList(votingGauge)) {
                /*
                    Possible reason:
                    old v1 gauge using streamer was killed but still have votes (gauge_relative_weight > 0)
                    If that's the case, you should hardcode the new recipient in streamer-v1-gauges.ts
                */
                const errorMessage = `VotingGauge not found in PrismaPoolStakingGauge: ${JSON.stringify(votingGauge)}`;
                console.error(errorMessage);
                throw Error(errorMessage);
            }
            // Store without staking relation when missing stakingGaugeId and invalid for voting
            return undefined;
        }
        return gauge.id;
    }

    /*
        Returns the gaugeAddress that matches the current VotingGauge in PrismaPoolStakingGauge

        v1 old gauge -> hardcoded recipient (old streamer)
        L1 gauge --> same gauge address
        L2 gauge -> root gauge recipient
    */
    getMatchingStakingGaugeAddress(chain: Chain, votingGauge: VotingGauge): string | undefined {
        if (v1RootGaugeRecipients[votingGauge.gaugeAddress]) {
            return v1RootGaugeRecipients[votingGauge.gaugeAddress].toLowerCase();
        }
        if (chain === 'MAINNET') {
            return votingGauge.gaugeAddress;
        } else {
            return votingGauge.recipient?.toLowerCase();
        }
    }

    updateOnchainGaugesWithSubgraphData(onchainGauges: VotingGauge[], subgraphGauges: SubGraphGauge[]) {
        const subgraphGaugesByAddress = keyBy(subgraphGauges, 'gaugeAddress');

        return onchainGauges.map((gauge) => {
            const votingGauge = gauge;
            const subGraphGauge = subgraphGaugesByAddress[gauge.gaugeAddress];
            if (subGraphGauge) {
                votingGauge.isInSubgraph = true;
                votingGauge.network = subGraphGauge.chain;
                votingGauge.recipient = subGraphGauge.recipient;
                votingGauge.addedTimestamp = subGraphGauge.addedTimestamp;
            }
            return votingGauge;
        });
    }

    /**
     * We need to use multicall3 with allowFailures=true because many of the root contracts do not have getRelativeWeightCap function defined
     */
    async fetchRelativeWeightCaps(gaugeAddresses: string[]) {
        const multicall3 = new Multicaller3(rootGaugeAbi, 50);

        gaugeAddresses.forEach((address) => {
            multicall3.call(address, address, 'getRelativeWeightCap');
        });

        return (await multicall3.execute()) as Record<string, BigNumber | undefined>;
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
        const multicaller = this.buildGaugeControllerHelperMulticaller();
        gaugeAddresses.forEach((address) =>
            multicaller.call(address, gaugeControllerHelperAddress, 'gauge_relative_weight', [address], false),
        );

        const response = (await multicaller.execute()) as Record<string, BigNumber>;

        return mapValues(response, (value) => Number(formatEther(value)));
    }

    async fetchIsKilled(gaugeAddresses: string[]) {
        const rootGaugeMulticaller = new Multicaller3(rootGaugeAbi);

        gaugeAddresses.forEach((address) => rootGaugeMulticaller.call(address, address, 'is_killed'));

        return (await rootGaugeMulticaller.execute()) as Record<string, boolean>;
    }

    buildGaugeControllerMulticaller() {
        return new Multicaller3(gaugeControllerAbi);
    }

    buildGaugeControllerHelperMulticaller() {
        return new Multicaller3(gaugeControllerHelperAbi);
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
