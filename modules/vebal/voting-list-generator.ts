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

//yarn ts-node -r dotenv/config ./vebal/voting-list-generator.ts

export async function generate() {
    initRequestScopedContext();

    const promises = Object.values(AllNetworkConfigs).map(async (network) => fetchGaugesInfo(network));
    const gaugeInfoForAllNetworks = await Promise.all(promises);
    const gaugesInfo = flatten(gaugeInfoForAllNetworks);

    console.log('Total gauges', gaugesInfo.length);

    const validGauges = await filterValidGauges(gaugesInfo);

    console.log('Total valid gauges', validGauges.length);

    // console.log('First gauge record: ', validGauges[0]);
    return validGauges;
}

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
