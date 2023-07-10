import { difference, pickBy } from 'lodash';
import { setMainnetRpcProviderForTesting } from '../../test/utils';
import { RootGaugesRepository, fetchRelativeWeightCaps } from './root-gauges.repository';
import { VotingListService } from './voting-list.service';

const defaultAnvilRpcUrl = 'http://127.0.0.1:8555';
setMainnetRpcProviderForTesting(defaultAnvilRpcUrl);

it('Contract Root gauges that are not in subgraph', async () => {
    // const service = new VotingListService();

    const rootGauges = new RootGaugesRepository();

    const rootGaugeAddresses = await rootGauges.getRootGaugeAddresses();

    // console.log(rootGaugeAddresses);

    const subgraphGauges = await rootGauges.fetchRootGaugesFromSubgraph(rootGaugeAddresses);

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
    const onchain = new RootGaugesRepository();

    const rootGaugeAddresses = await onchain.getRootGaugeAddresses();

    const relativeWeightCapsWithFailures = await fetchRelativeWeightCaps(rootGaugeAddresses);

    // console.log(relativeWeightCapsWithFailures);

    var failedOnes = pickBy(relativeWeightCapsWithFailures, (value, key) => {
        return value === undefined;
    });

    console.log('Number of root gauges without getRelativeWeight: ', Object.keys(failedOnes).length);
    // console.log('Root gauge addresses without getRelativeWeight: ', Object.keys(failedOnes));
}, 1000_000);

it('Returns veBAL pool icons', async () => {
    const service = new VotingListService();

    const pools = await service.getPoolsForVotingList([
        '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014',
    ]);

    const veBalPoolTokenUris = pools[0].tokens.map((token) => token.token.logoURI);

    expect(veBalPoolTokenUris).toEqual([
        'https://raw.githubusercontent.com/balancer/tokenlists/main/src/assets/images/tokens/0xba100000625a3754423978a60c9317c58a424e3d.png',
        'https://raw.githubusercontent.com/balancer/tokenlists/main/src/assets/images/tokens/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
    ]);
}, 1000_000);

it.skip('Returns voting pools ', async () => {
    const service = new VotingListService();

    const votingPools = await service.getVotingList();

    console.log('Number of voting pools: ', votingPools.length);

    const firstPool = votingPools[0];

    expect(firstPool.gauge).toMatchInlineSnapshot(`
      {
        "address": "0x6ba66967b0723718d616ad5f293c2ae6d7b0fcae",
        "isKilled": false,
        "relativeWeightCap": "0.02",
      }
    `);

    // Weight of first token
    expect(firstPool.tokens[0]).toMatchInlineSnapshot(`
      {
        "address": "0x29c1ea5ed7af53094b1a79ef60d20641987c867e",
        "dynamicData": {
          "weight": "0.5",
        },
        "token": {
          "logoURI": "https://assets.coingecko.com/coins/images/29418/large/acid_200_200.png?1678696816",
          "symbol": "ACID",
        },
      }
    `);
}, 1000_000);

it('Returns veBAL voting pool', async () => {
    const service = new VotingListService();

    const veBalAddress = '0xb78543e00712c3abba10d0852f6e38fde2aaba4d';

    const pools = await service.getVotingList();

    const veBalRootGauge = pools.find((pool) => pool.gauge.address === veBalAddress);

    expect(veBalRootGauge?.gauge).toMatchInlineSnapshot(`
      {
        "address": "0xb78543e00712c3abba10d0852f6e38fde2aaba4d",
        "isKilled": false,
        "relativeWeightCap": null,
      }
    `);
}, 1000_000);

it('Returns TWAMM voting pool', async () => {
    const service = new VotingListService();

    const twammAddress = '0xb5bd58c733948e3d65d86ba9604e06e5da276fd1';

    const pools = await service.getVotingListWithHardcodedPools();

    const twammPool = pools.find((pool) => pool.gauge.address === twammAddress);

    expect(twammPool?.gauge).toMatchInlineSnapshot(`
      {
        "address": "0xb5bd58c733948e3d65d86ba9604e06e5da276fd1",
        "isKilled": false,
        "relativeWeightCap": null,
      }
    `);
}, 1000_000);

it('Full flow', async () => {
    const service = new VotingListService();

    const repository = new RootGaugesRepository();
    let onchainRootAddresses: string[] = await repository.getRootGaugeAddresses();

    console.log('Number of addresses download: ', onchainRootAddresses.length);

    // Test full flow with specific addresses
    // onchainRootAddresses = ['0xb78543e00712c3abba10d0852f6e38fde2aaba4d'];

    repository.deleteRootGauges();
    await service.sync(onchainRootAddresses);
}, 1000_000);
