import { difference, pickBy } from 'lodash';
import { setMainnetRpcProviderForTesting } from '../../test/utils';
import { VotingGaugesRepository } from './voting-gauges.repository';
import { VeBalVotingListService } from './vebal-voting-list.service';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { AllNetworkConfigs } from '../network/network-config';
import { mainnetNetworkConfig } from '../network/mainnet';

const defaultAnvilRpcUrl = 'http://127.0.0.1:8555';
setMainnetRpcProviderForTesting(defaultAnvilRpcUrl);

// TODO: understand why mainnetConfig is undefined in test context
AllNetworkConfigs['1'] = mainnetNetworkConfig;

beforeEach(() => {
    initRequestScopedContext();
    setRequestScopedContextValue('chainId', '1');
});

it('Controller Contract gauges that are not in subgraph', async () => {
    const repository = new VotingGaugesRepository();

    const votingGaugeAddresses = await repository.getVotingGaugeAddresses();

    const subgraphGauges = await repository.fetchVotingGaugesFromSubgraph(votingGaugeAddresses);

    const diff = difference(
        votingGaugeAddresses,
        subgraphGauges.map((gauge) => gauge.gaugeAddress),
    );

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

it('Voting gauges without getRelativeWeightCap', async () => {
    const repository = new VotingGaugesRepository();

    const votingGaugeAddresses = await repository.getVotingGaugeAddresses();

    const relativeWeightCapsWithFailures = await repository.fetchRelativeWeightCaps(votingGaugeAddresses);

    var failedOnes = pickBy(relativeWeightCapsWithFailures, (value, key) => {
        return value === undefined;
    });

    console.log('Number of voting gauges without getRelativeWeight: ', Object.keys(failedOnes).length);
    // console.log('Voting gauge addresses without getRelativeWeight: ', Object.keys(failedOnes));
}, 1000_000);

it('Returns veBAL pool icons', async () => {
    const service = new VeBalVotingListService();

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
    const service = new VeBalVotingListService();

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
    const service = new VeBalVotingListService();

    const veBalAddress = '0xb78543e00712c3abba10d0852f6e38fde2aaba4d';

    const pools = await service.getVotingList();

    const veBalVotingPool = pools.find((pool) => pool.gauge.address === veBalAddress);

    expect(veBalVotingPool?.gauge).toMatchInlineSnapshot(`
      {
        "addedTimestamp": null,
        "address": "0xb78543e00712c3abba10d0852f6e38fde2aaba4d",
        "childGaugeAddress": null,
        "isKilled": false,
        "relativeWeightCap": "0.1",
      }
    `);

    expect(veBalVotingPool?.symbol).toBe('B-80BAL-20WETH');
}, 1000_000);

it('returns veLIT and veUSH voting pools', async () => {
    const service = new VeBalVotingListService();

    const pools = await service.getVotingList();

    const veLITAddress = '0x56124eb16441a1ef12a4ccaeabdd3421281b795a';
    const veLITVotingPool = pools.find((pool) => pool.gauge.address === veLITAddress);

    expect(veLITVotingPool?.symbol).toBe('BAL-20WETH-80LIT');

    const veUSHAddress = '0x5b79494824bc256cd663648ee1aad251b32693a9';
    const veUSHVotingPool = pools.find((pool) => pool.gauge.address === veUSHAddress);

    expect(veUSHVotingPool?.symbol).toBe('80USH-20unshETH');
}, 1000_000);

it('Returns first TWAMM (from CRON finance) voting pool', async () => {
    const service = new VeBalVotingListService();

    const twammAddress = '0xb5bd58c733948e3d65d86ba9604e06e5da276fd1';

    const pools = await service.getVotingListWithHardcodedPools();

    const twammPool = pools.find((pool) => pool.gauge.address === twammAddress);

    expect(twammPool?.gauge).toMatchInlineSnapshot(`
      {
        "addedTimestamp": 1663017781,
        "address": "0xb5bd58c733948e3d65d86ba9604e06e5da276fd1",
        "isKilled": false,
        "relativeWeightCap": null,
      }
    `);
}, 1000_000);

it('Returns second TWAMM (from CRON finance) voting pool', async () => {
    const service = new VeBalVotingListService();

    const twamm2Address = '0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c';

    const pools = await service.getVotingListWithHardcodedPools();

    const twammPool = pools.find((pool) => pool.gauge.address === twamm2Address);

    expect(twammPool?.gauge).toMatchInlineSnapshot(`
      {
        "addedTimestamp": 1690387253,
        "address": "0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c",
        "isKilled": false,
        "relativeWeightCap": "0.02",
      }
    `);
}, 1000_000);

it('Returns childGaugeAddress field for L2 pools (but not for mainnet pools)', async () => {
    const service = new VeBalVotingListService();

    const list = await service.getVotingList();

    const mainnetPools = list.filter((pool) => pool.chain === 'MAINNET');

    expect(mainnetPools.length).toBeGreaterThan(0);

    mainnetPools.forEach((pool) => {
        expect(pool.gauge.childGaugeAddress).toBeNull();
    });

    const l2Pools = list.filter((pool) => pool.chain !== 'MAINNET');
    expect(l2Pools.length).toBeGreaterThan(0);

    l2Pools.forEach((pool) => {
        expect(pool.gauge.childGaugeAddress).toBeDefined();
    });
}, 1000_000);

it('Fetches gauge_relative_weight using GaugeControllerHelper', async () => {
    const repository = new VotingGaugesRepository();
    let onchainRootAddresses: string[] = await repository.getVotingGaugeAddresses();

    const result = await repository.fetchRelativeWeights(onchainRootAddresses.slice(0, 50));

    console.log('Number of addresses download: ', onchainRootAddresses.length);

    expect(Object.values(result).length).toBe(50);
    expect(result['0x34f33cdaed8ba0e1ceece80e5f4a73bcf234cfac']).toMatchInlineSnapshot('0.000002246037288695');
}, 1000_000);

it.skip('Full flow (to test with production rpc)', async () => {
    const service = new VeBalVotingListService();

    const repository = new VotingGaugesRepository();
    let onchainRootAddresses: string[] = await repository.getVotingGaugeAddresses();

    console.log('Number of addresses download: ', onchainRootAddresses.length);

    // Test full flow with specific addresses
    // onchainRootAddresses = ['0xb78543e00712c3abba10d0852f6e38fde2aaba4d'];

    repository.deleteVotingGauges();
    await service.sync(onchainRootAddresses);
}, 1000_000);

it('Full flow with subset of gauges', async () => {
    const onchainRootAddresses = ['0x2dc55e84baf47296c2cf87b4ec3eb66fd7665611'];
    const service = new VeBalVotingListService();

    await service.sync(onchainRootAddresses);
}, 1000_000);

it('Confirm invalid gauge addresses', async () => {
    const invalidAddressesFromOldGaugeList = [
        '0x06df3b2bbb68adc8b0e302443692037ed9f91b42',
        '0xa02e4b3d18d4e6b8d18ac421fbc3dfff8933c40a',
        '0x2d344a84bac123660b021eebe4eb6f12ba25fe86',
        '0x178e029173417b1f9c8bc16dcec6f697bc323746',
        '0x6a5ead5433a50472642cd268e584dafa5a394490',
        '0x496ff26b76b8d23bbc6cf1df1eee4a48795490f7',
        '0xe340ebfcaa544da8bb1ee9005f1a346d50ec422e',
        '0x4ce0bd7debf13434d3ae127430e9bd4291bfb61f',
        '0x8e85e97ed19c0fa13b2549309965291fbbc0048b',
        '0x4fd4687ec38220f805b6363c3c1e52d0df3b5023',
        '0xa718042e5622099e5f0ace4e7122058ab39e1bbe',
        '0xb5e3de837f869b0248825e0175da73d4e8c3db6b',
        '0x483006684f422a9448023b2382615c57c5ecf18f',
        '0xcaa052584b462198a5a9356c28bce0634d65f65c',
        '0x03cd191f589d12b0582a99808cf19851e468e6b5',
        '0xaf5e0b5425de1f5a630a8cb5aa9d97b8141c908d',
        '0x805ca3ccc61cc231851dee2da6aabff0a7714aa7',
        '0xdb1db6e248d7bb4175f6e5a382d0a03fe3dcc813',
        '0xc17636e36398602dd37bb5d1b3a9008c7629005f',
        '0x8159462d255c1d24915cb51ec361f700174cd994',
        '0xb20fc01d21a50d2c734c4a1262b4404d41fa7bf0',
        '0x4a0b73f0d13ff6d43e304a174697e3d5cfd310a4',
        '0xe22483774bd8611be2ad2f4194078dac9159f4ba',
        '0xcc65a812ce382ab909a11e434dbf75b34f1cc59d',
        '0xfb5e6d0c1dfed2ba000fbc040ab8df3615ac329c',
        '0x178e029173417b1f9c8bc16dcec6f697bc323746',
        '0x077794c30afeccdf5ad2abc0588e8cee7197b71a',
    ];

    const repository = new VotingGaugesRepository();

    const oldGauges = await repository.fetchVotingGaugesFromSubgraph(invalidAddressesFromOldGaugeList);

    const oldGaugeAddresses = oldGauges.map((gauge) => gauge.gaugeAddress);

    const onchainGauges = await repository.fetchOnchainVotingGauges(oldGaugeAddresses);

    onchainGauges.forEach((gauge) => {
        expect(gauge.isKilled).toBe(true);
        expect(gauge.relativeWeight).toBe(0);
    });
});

it('Uses streamer-v1-map to find gauges (that use streamer instead of recipient)', async () => {
    const oldRootV1GaugeAddress = '0xcf5938ca6d9f19c73010c7493e19c02acfa8d24d';
    const anotherOldRootV1GaugeAddress = '0x6823dca6d70061f2ae2aaa21661795a2294812bf';
    const service = new VeBalVotingListService();

    const rootGaugeAddresses = [oldRootV1GaugeAddress, anotherOldRootV1GaugeAddress];
    const { votingGauges: fetchedVotingGauges } = await service.fetchVotingGauges(rootGaugeAddresses);

    const repository = new VotingGaugesRepository();
    const savedGauges = await repository.saveVotingGauges(fetchedVotingGauges);

    expect(savedGauges).toMatchInlineSnapshot(`
    {
      "saveErrors": [],
      "votingGaugesWithStakingGaugeId": [
        {
          "addedTimestamp": 1657479716,
          "gaugeAddress": "0xcf5938ca6d9f19c73010c7493e19c02acfa8d24d",
          "isInSubgraph": true,
          "isKilled": true,
          "network": "POLYGON",
          "recipient": "0x90a6ec799f21a154ab7affd0b34c5f3f129808e2",
          "relativeWeight": 0.000004272480965146,
          "relativeWeightCap": undefined,
          "stakingGaugeId": "0xaa59736b80cf77d1e7d56b7bba5a8050805f5064",
        },
        {
          "addedTimestamp": 1650405644,
          "gaugeAddress": "0x6823dca6d70061f2ae2aaa21661795a2294812bf",
          "isInSubgraph": true,
          "isKilled": true,
          "network": "ARBITRUM",
          "recipient": "0xd5cd8328d93bf4bef9824fd288f32c8f0da1c551",
          "relativeWeight": 1.921078491e-9,
          "relativeWeightCap": undefined,
          "stakingGaugeId": "0xfaad21203a7856889cb6eb644ab6864e7253107a",
        },
      ],
    }
    `);
}, 1000_000);
