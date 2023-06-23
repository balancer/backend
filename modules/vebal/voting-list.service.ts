import { formatFixed } from '@ethersproject/bignumber';
import { formatUnits } from 'ethers/lib/utils';
import { chunk, zipObject } from 'lodash';
import { networkContext } from '../../modules/network/network-context.service';
import { getContractAt } from '../../modules/web3/contract';
import { prisma } from '../../prisma/prisma-client';
import { Multicaller } from '../web3/multicaller';
import gaugeControllerAbi from './abi/gaugeController.json';
export class VotingListService {
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
