import { Chain } from '@prisma/client';
import { keyBy } from 'lodash';

import mainnet from '../../config/mainnet';
import gaugeControllerAbi from './abi/gaugeController.json';
import rootGaugeAbi from './abi/rootGauge.json';
import { PrismaClient } from '@prisma/client';
import { prisma as prismaClient } from '../../prisma/prisma-client';
import { v1RootGaugeRecipients } from './special-pools/streamer-v1-gauges';
import { GaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { formatEther } from 'viem';
import { getViemClient, IViemClient } from '../sources/viem-client';

const { gaugeControllerAddress, gaugeControllerHelperAddress } = mainnet;

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
    constructor(
        private prisma: PrismaClient = prismaClient,
        private viemClient: IViemClient = getViemClient('MAINNET'),
    ) {}

    async getVotingGaugeAddresses() {
        const totalGauges = await this.viemClient
            .readContract({
                address: gaugeControllerAddress as `0x${string}`,
                functionName: 'n_gauges',
                abi: gaugeControllerAbi,
            })
            .then(Number);

        const contracts = Array.from({ length: totalGauges }, (_, index) => ({
            abi: gaugeControllerAbi as any,
            address: gaugeControllerAddress as `0x${string}`,
            functionName: 'gauges',
            args: [index],
        }));

        const addresses = await this.viemClient
            .multicall({ contracts, allowFailure: false })
            .then((results) => results.map((address) => (address as string).toLowerCase()));

        return addresses;
    }

    async fetchTypeNames() {
        const totalGaugesTypes = await this.viemClient
            .readContract({
                address: gaugeControllerAddress as `0x${string}`,
                functionName: 'n_gauge_types',
                abi: gaugeControllerAbi,
            })
            .then(Number);

        const contracts = Array.from({ length: totalGaugesTypes }, (_, index) => ({
            abi: gaugeControllerAbi as any,
            address: gaugeControllerAddress as `0x${string}`,
            functionName: 'gauge_type_names',
            args: [index],
        }));

        const typeNames = (await this.viemClient.multicall({ contracts, allowFailure: false })) as string[];

        return typeNames;
    }

    // Many of the root contracts do not have getRelativeWeightCap function defined, so expect undefined values
    async fetchRelativeWeightCaps(gaugeAddresses: string[]): Promise<Record<string, string | undefined>> {
        const contracts = gaugeAddresses.map((address) => ({
            abi: rootGaugeAbi as any,
            address: address as `0x${string}`,
            functionName: 'getRelativeWeightCap',
        }));

        const results = await this.viemClient.multicall({ contracts });
        const caps = gaugeAddresses.map((address, index) => {
            const result = results[index];
            const cap = result.status === 'success' ? formatEther(result.result as bigint) : undefined;
            return [address, cap];
        });

        return Object.fromEntries(caps);
    }

    /*
        gauge_types are not reliable because they are manually input by Maxis
        We will use subgraph chain field instead
        However, we keep pulling this gauge_types cause they can be useful for debugging (when a root gauge is not found in the subgraph)
    */
    async fetchGaugeTypes(gaugeAddresses: string[]) {
        const typeNames = await this.fetchTypeNames();

        const contracts = gaugeAddresses.map((address) => ({
            abi: gaugeControllerAbi as any,
            address: gaugeControllerAddress as `0x${string}`,
            functionName: 'gauge_types',
            args: [address],
        }));

        const results = await this.viemClient.multicall({ contracts, allowFailure: false });
        const types = gaugeAddresses.map((address, index) => {
            const type = results[index];
            return [address, typeNames[Number(type)]] as [string, string];
        });

        return Object.fromEntries(types);
    }

    async fetchRelativeWeights(gaugeAddresses: string[]) {
        const contracts = gaugeAddresses.map((address) => ({
            abi: gaugeControllerAbi as any,
            address: gaugeControllerHelperAddress as `0x${string}`,
            functionName: 'gauge_relative_weight',
            args: [address],
        }));

        const results = await this.viemClient.multicall({ contracts, allowFailure: false });

        const weigths = gaugeAddresses.map((address, index) => {
            let weight = results[index] as bigint;
            return [address, Number(formatEther(weight))] as [string, number];
        });

        return Object.fromEntries(weigths);
    }

    async fetchIsKilled(gaugeAddresses: string[]) {
        const contracts = gaugeAddresses.map((address) => ({
            abi: rootGaugeAbi as any,
            address: address as `0x${string}`,
            functionName: 'is_killed',
        }));
        const results = await this.viemClient.multicall({ contracts, allowFailure: false });
        const kills = gaugeAddresses.map((address, index) => {
            return [address, results[index] as boolean];
        });

        return Object.fromEntries(kills);
    }

    async fetchOnchainVotingGauges(gaugeAddresses: string[]): Promise<VotingGauge[]> {
        const relativeWeights = await this.fetchRelativeWeights(gaugeAddresses);

        const isKilled = await this.fetchIsKilled(gaugeAddresses);

        const relativeWeightCaps = await this.fetchRelativeWeightCaps(gaugeAddresses);

        const gaugeTypes = await this.fetchGaugeTypes(gaugeAddresses);

        let votingGauges: VotingGauge[] = [];
        gaugeAddresses.forEach((gaugeAddress) => {
            if (gaugeTypes[gaugeAddress] === 'Liquidity Mining Committee') return;
            votingGauges.push({
                gaugeAddress: gaugeAddress.toLowerCase(),
                network: this.toPrismaNetwork(gaugeTypes[gaugeAddress]),
                isKilled: isKilled[gaugeAddress],
                relativeWeight: relativeWeights[gaugeAddress],
                relativeWeightCap: relativeWeightCaps[gaugeAddress],
                isInSubgraph: false,
            });
        });

        return votingGauges;
    }

    async fetchVotingGaugesFromSubgraph(onchainAddresses: string[]) {
        // This service only works with the mainnet subgraph, will return no voting gauges for other chains
        const gaugeSubgraphService = new GaugeSubgraphService(mainnet.subgraphs.gauge!);
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

    async saveVotingGauges(votingGauges: VotingGauge[]) {
        const saveErrors: Error[] = [];
        const votingGaugesWithStakingGaugeId = await Promise.all(
            votingGauges.map(async (gauge) => {
                try {
                    const stakingId = await this.findStakingGaugeId(gauge);
                    gauge.stakingGaugeId = stakingId;
                    await this.saveVotingGauge(gauge);
                    return gauge;
                } catch (error) {
                    saveErrors.push(new Error(`Failed to save voting gauge ${gauge.gaugeAddress} with error ${error}`));
                    return gauge;
                }
            }),
        );

        return { votingGaugesWithStakingGaugeId, saveErrors };
    }

    async saveVotingGauge(gauge: VotingGauge) {
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
