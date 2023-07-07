import { difference, pickBy } from 'lodash';
import { mainnetNetworkConfig } from '../network/mainnet';
import { createHttpClient } from '../network/viem/clients';
import { OnChainRootGauges, veGauges } from './root-gauges.onchain';
import { fetchRootGaugesFromSubgraph } from './root-gauges.subgraph';
import { VotingListService } from './voting-list.service';
import { Address } from 'viem';

const httpRpc = 'http://127.0.0.1:8555';
console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
const testHttpClient = createHttpClient(httpRpc);
mainnetNetworkConfig.publicClient = testHttpClient;

it('Contract Root gauges that are not in subgraph', async () => {
    // const service = new VotingListService();

    const onchain = new OnChainRootGauges();

    const rootGaugeAddresses = await onchain.getRootGaugeAddresses();

    // console.log(rootGaugeAddresses);

    const subgraphGauges = await fetchRootGaugesFromSubgraph(rootGaugeAddresses);

    const diff = difference(
        rootGaugeAddresses,
        subgraphGauges.map((gauge) => gauge.gaugeAddress),
    );

    // console.log('Contract RootGauges that are not in subgraph: ', diff);

    expect(diff.sort()).toEqual(
        [
            '0x7aa5475b2ea29a9f4a1b9cf1cb72512d1b4ab75e', //Liquidity Mining Committee gauge
            '0x56124eb16441a1ef12a4ccaeabdd3421281b795a', // veLIT
            '0x5b79494824bc256cd663648ee1aad251b32693a9', // veUSH
            '0xb78543e00712c3abba10d0852f6e38fde2aaba4d', // veBAL
            '0x3f829a8303455cb36b7bcf3d1bdc18d5f6946aea', // Arbitrum killed gauge that was replaced by 0xd758454bdf4df7ad85f7538dc9742648ef8e6d0a
            '0xe867ad0a48e8f815dc0cda2cdb275e0f163a480b', // old veBal??
            '0x9fb8312cedfb9b35364ff06311b429a2f4cdf422',
        ].sort(),
    );
}, 1000_000);

it('Root gauges without getRelativeWeightCap', async () => {
    const onchain = new OnChainRootGauges();

    const rootGaugeAddresses = await onchain.getRootGaugeAddresses();

    const relativeWeightCapsWithFailures = await onchain.multicallRootGaugesAllowingFailures(
        rootGaugeAddresses as Address[],
        'getRelativeWeightCap',
    );

    // console.log(relativeWeightCapsWithFailures);

    var failedOnes = pickBy(relativeWeightCapsWithFailures, (value, key) => {
        return value.error;
    });

    console.log('Number of root gauges without getRelativeWeight: ', Object.keys(failedOnes).length);
    // console.log('Root gauge addresses without getRelativeWeight: ', Object.keys(failedOnes));
}, 1000_000);

it.only('MOVE TO PRODUCTION:, finds vebal by recipient', async () => {
    const service = new VotingListService();
    const onchain = new OnChainRootGauges();

    const recipients = await onchain.fetchRecipientsForVeGauges();

    console.log(recipients);
}, 1000_000);
