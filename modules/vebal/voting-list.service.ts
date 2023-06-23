import { formatUnits, getAddress } from 'ethers/lib/utils';
import { capitalize, flatten, chain, times, chunk, zipObject } from 'lodash';
import { setRequestScopedContextValue } from '../../modules/context/request-scoped-context';
import { AllNetworkConfigs } from '../../modules/network/network-config';
import { networkContext } from '../../modules/network/network-context.service';
import {
    LiquidityGaugesInfo,
    gaugeSubgraphService,
} from '../../modules/subgraphs/gauge-subgraph/gauge-subgraph.service';
import { getContractAt } from '../../modules/web3/contract';
import { NetworkConfig } from '../network/network-config-types';
import { prisma } from '../../prisma/prisma-client';
import { Chain as PrismaChain, PrismaPoolStakingGauge } from '@prisma/client';
import { Chain as SubgraphChain } from '../subgraphs/gauge-subgraph/generated/gauge-subgraph-types';
import { Multicaller } from '../web3/multicaller';
import gaugeControllerAbi from './abi/gaugeController.json';
import { formatFixed } from '@ethersproject/bignumber';

type LiquidityGaugeInfo = LiquidityGaugesInfo[number];
interface GaugeInfo extends LiquidityGaugeInfo {
    chain: PrismaChain;
}
type GaugesInfo = GaugeInfo[];

export class VotingListService {
    async syncVotingList() {
        const promises = Object.values(AllNetworkConfigs).map(async (network) => fetchGaugesInfo(network));
        const gaugeInfoForAllNetworks = await Promise.all(promises);
        const gaugesInfo = flatten(gaugeInfoForAllNetworks);

        console.log('Total gauges', gaugesInfo.length);

        const validGauges = await filterValidGauges(gaugesInfo);

        console.log('Total valid gauges', validGauges.length);

        // console.log('First gauge record: ', validGauges[0]);
        return validGauges;
    }

    async getList(): Promise<PrismaPoolStakingGauge[]> {
        return await prisma.prismaPoolStakingGauge.findMany();
    }

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
        // console.log('pools!', pools);
        return Promise.resolve(pools);
    }
}

export const votingListService = new VotingListService();

async function fetchGaugesInfo(network: NetworkConfig): Promise<GaugesInfo> {
    const chainId = network.data.chain.id;
    setRequestScopedContextValue('chainId', chainId.toString());

    const isMainnet = chainId === 1;
    //TODO: We only have poolsWithGauges for mainnet and arbitrum for testing purposes
    if (![1, 42161].includes(chainId)) return [];
    // if (![42161].includes(chainId)) return [];
    const poolIds = network.poolsWithGauges as string[];

    if (isMainnet) return fetchMainnetGaugesInfo(poolIds);
    return fetchL2GaugesInfo(poolIds, network);
}

async function fetchMainnetGaugesInfo(poolIds: string[]): Promise<GaugesInfo> {
    const gaugesInfo = await gaugeSubgraphService.getGaugesInfo(poolIds);
    console.log(`⬇️  Fetched ${gaugesInfo.length} gauge info records for Mainnet`);
    return gaugesInfo.map((rootGauge) => {
        return { ...rootGauge, chain: 'MAINNET' };
    });
}

async function fetchL2GaugesInfo(poolIds: string[], network: NetworkConfig): Promise<GaugesInfo> {
    const streamers = (await gaugeSubgraphService.getGaugesStreamers(poolIds)).map((gauge) => {
        return {
            address: gauge.id,
            streamer: gauge.streamer,
            poolId: gauge.poolId as string,
        };
    });

    const poolIdsByRecipient = streamers.reduce((acc: Record<string, string>, streamer) => {
        const recipient = streamer.streamer ? streamer.streamer : streamer.address;
        acc[recipient] = streamer.poolId;
        return acc;
    }, {});

    // TODO: improve TS check
    const chainName: SubgraphChain = capitalize(network.data.chain.slug) as SubgraphChain;

    const recipients = Object.keys(poolIdsByRecipient);
    let rootGauges = await gaugeSubgraphService.getRootGaugesInfo(recipients, chainName);
    console.log(`⬇️  Fetched ${rootGauges.length} gauge info records for ${chainName}`);

    return rootGauges.map((rootGauge) => {
        // Manually add poolId as we cannot get it in the RootGauges query above
        return { ...rootGauge, poolId: poolIdsByRecipient[rootGauge.recipient], chain: network.data.chain.prismaId };
    });
}

/**
 * Excludes killed gauges with zero weight
 */
async function filterValidGauges(gauges: GaugesInfo): Promise<GaugesInfo> {
    const relativeWeights = await fetchGaugeRelativeWeights();

    const validGauges = gauges.filter(({ id, isKilled }) => !isKilled || relativeWeights[getAddress(id)] !== '0.0');
    return validGauges;
}

/**
 * Fetches the relative weight of all gauges using the GaugeController Contract following this steps:
 * 1) onchain call to know the total number of gauges
 * 2) multicall (in chunks of 100) to get the list of gauge addresses
 * 3) multicall (in chunks of 100) to get the gauge_relative_weight for each gauge address
 */
export async function fetchGaugeRelativeWeights(): Promise<Record<string, string>> {
    const gaugeControllerAddress = '0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD';
    const gaugeControllerContract = getContractAt(gaugeControllerAddress, gaugeControllerAbi);
    const totalGauges = Number(formatFixed(await gaugeControllerContract.n_gauges()));

    // There are two versions of gauge_relative_weight (argument override)
    // so we filter the ABI to only include the one that we are using
    const abi = gaugeControllerAbi.filter((item) => !(item.name === 'gauge_relative_weight' && item.inputs.length > 1));
    const multicall = new Multicaller(networkContext.data.multicall, networkContext.provider, abi);

    const gaugeIndexes = generateGaugeIndexes(totalGauges);
    const chunkSize = 100;
    const indexChunks = chunk(gaugeIndexes, chunkSize);

    let gaugeAddresses: string[] = [];
    for (const gaugeIndexes of indexChunks) {
        const chunkAddresses = await executeGaugesCalls(gaugeIndexes);
        gaugeAddresses = [...gaugeAddresses, ...chunkAddresses];
    }

    const addressChunks = chunk(gaugeAddresses, chunkSize);
    let relativeWeights: Record<string, string> = {};
    for (const addressChunk of addressChunks) {
        const chunkWeights = await executeRelativeWeightCalls(addressChunk);
        relativeWeights = { ...relativeWeights, ...chunkWeights };
    }

    return relativeWeights;

    async function executeGaugesCalls(gaugeIndexes: number[]): Promise<string[]> {
        gaugeIndexes.map((i) => multicall.call(`${i}`, gaugeControllerAddress, 'gauges', [i]));
        const result = await multicall.execute();
        return Object.values(result);
    }

    async function executeRelativeWeightCalls(gaugeAddresses: string[]): Promise<Record<string, string>> {
        gaugeAddresses.map((address) =>
            multicall.call(`${address}`, gaugeControllerAddress, 'gauge_relative_weight', [address]),
        );
        const weights = await multicall.execute();
        const formattedWeights = Object.values(weights).map((weight) => formatUnits(weight, 18));
        return zipObject(gaugeAddresses, formattedWeights);
    }

    function generateGaugeIndexes(totalGauges: number) {
        return [...Array(totalGauges)].map((_, index) => index);
    }
}
