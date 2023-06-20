import { Interface, getAddress } from 'ethers/lib/utils';
import { capitalize, flatten } from 'lodash';
import { initRequestScopedContext, setRequestScopedContextValue } from '../../modules/context/request-scoped-context';
import { AllNetworkConfigs } from '../../modules/network/network-config';
import { networkContext } from '../../modules/network/network-context.service';
import multicall3Abi from '../../modules/pool/lib/staking/abi/Multicall3.json';
import { GaugesInfo, gaugeSubgraphService } from '../../modules/subgraphs/gauge-subgraph/gauge-subgraph.service';
import { Chain } from '../../modules/subgraphs/gauge-subgraph/generated/gauge-subgraph-types';
import { getContractAt } from '../../modules/web3/contract';
import { NetworkConfig } from '../network/network-config-types';
import veBalHelpersAbi from './abi/veBalHelpers.json';
import { prisma } from '../../prisma/prisma-client';

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
    const poolIds = network.poolsWithGauges as string[];

    if (isMainnet) return fetchMainnetGaugesInfo(poolIds);
    return fetchL2GaugesInfo(poolIds, network);
}

async function fetchMainnetGaugesInfo(poolIds: string[]): Promise<GaugesInfo> {
    const gaugesInfo = await gaugeSubgraphService.getGaugesInfo(poolIds);
    console.log(`⬇️  Fetched ${gaugesInfo.length} gauge info records for Mainnet`);
    return gaugesInfo;
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
    const chainName: Chain = capitalize(network.data.chain.slug) as Chain;

    const recipients = Object.keys(poolIdsByRecipient);
    let rootGauges = await gaugeSubgraphService.getRootGaugesInfo(recipients, chainName);
    console.log(`⬇️  Fetched ${rootGauges.length} gauge info records for ${chainName}`);

    return rootGauges.map((rootGauge) => {
        // Manually add poolId as we cannot get it in the RootGauges query above
        return { ...rootGauge, poolId: poolIdsByRecipient[rootGauge.recipient] };
    });
}

/**
 * Excludes killed gauges with zero weight
 */
async function filterValidGauges(gauges: GaugesInfo): Promise<GaugesInfo> {
    const killedGaugesList = gauges.filter(({ isKilled }) => isKilled).map(({ id }) => getAddress(id));

    const killedGaugesWeight = await getGaugeRelativeWeight(killedGaugesList);

    const validGauges = gauges.filter(({ id, isKilled }) => !isKilled || killedGaugesWeight[getAddress(id)] !== '0.0');
    return validGauges;
}

export async function getGaugeRelativeWeight(gaugeAddresses: string[]): Promise<Record<string, string>> {
    //TODO: Include this address in network config
    const veBALHelperAddress = '0x8e5698dc4897dc12243c8642e77b4f21349db97c';
    const multicall = getContractAt(networkContext.data.multicall3, multicall3Abi);

    const veBalHelpers = new Interface(veBalHelpersAbi);

    const calls = gaugeAddresses.map((address) => [
        veBALHelperAddress,
        false, // do not allow failures
        veBalHelpers.encodeFunctionData('gauge_relative_weight', [address]),
    ]);
    // const result = await multicall.callStatic.aggregate3(calls);
    // const weights = mapValues(result, weight => formatUnits(weight, 18));

    //DEBUG: Return fake results until multicall is tested
    return gaugeAddresses.reduce((acc: Record<string, string>, address: string) => {
        acc[address] = '-0.1';
        //DEBUG: explicit exclude 2 addresses
        acc['0xB0de49429fBb80c635432bbAD0B3965b28560177'] = '0.0';
        acc['0xF0ea3559Cf098455921d74173dA83fF2f6979495'] = '0.0';
        return acc;
    }, {});
}
