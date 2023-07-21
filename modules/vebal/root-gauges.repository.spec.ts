import { setMainnetRpcProviderForTesting } from '../../test/utils';
import { defaultStakingGaugeId, prismaMock } from './prismaPoolStakingGauge.mock';
import { RootGauge, RootGaugesRepository } from './root-gauges.repository';
import { Chain } from '@prisma/client';

const httpRpc = 'http://127.0.0.1:8555';
setMainnetRpcProviderForTesting(httpRpc);

it('maps onchain network format into prisma chain format', async () => {
    const repository = new RootGaugesRepository();
    expect(repository.toPrismaNetwork('Mainnet')).toBe(Chain.MAINNET);
    expect(repository.toPrismaNetwork('Optimism')).toBe(Chain.OPTIMISM);
    expect(repository.toPrismaNetwork('veBAL')).toBe(Chain.MAINNET);
    expect(() => repository.toPrismaNetwork('Unknown')).toThrowError('Network UNKNOWN is not supported');
});

it('fetches list of root gauge addresses', async () => {
    const repository = new RootGaugesRepository();
    const addresses = await repository.getRootGaugeAddresses();
    expect(addresses.length).toBe(333);
}, 10_000);

it('generates root gauge rows given a list of gauge addresses', async () => {
    const repository = new RootGaugesRepository();

    const rootGaugeAddresses = [
        '0x79eF6103A513951a3b25743DB509E267685726B7',
        '0xfb0265841C49A6b19D70055E596b212B0dA3f606',
        '0x8F7a0F9cf545DB78BF5120D3DBea7DE9c6220c10',
    ];
    // Uncomment to test with all the root gauges
    // const rootGaugeAddresses = await service.getRootGaugeAddresses();

    const rows = await repository.fetchOnchainRootGauges(rootGaugeAddresses);

    expect(rows).toMatchInlineSnapshot(`
      [
        {
          "gaugeAddress": "0x79ef6103a513951a3b25743db509e267685726b7",
          "isInSubgraph": false,
          "isKilled": false,
          "network": "MAINNET",
          "relativeWeight": 0.07554542388100179,
          "relativeWeightCap": undefined,
        },
        {
          "gaugeAddress": "0xfb0265841c49a6b19d70055e596b212b0da3f606",
          "isInSubgraph": false,
          "isKilled": true,
          "network": "OPTIMISM",
          "relativeWeight": 0,
          "relativeWeightCap": undefined,
        },
        {
          "gaugeAddress": "0x8f7a0f9cf545db78bf5120d3dbea7de9c6220c10",
          "isInSubgraph": false,
          "isKilled": false,
          "network": "ARBITRUM",
          "relativeWeight": 0,
          "relativeWeightCap": "0.02",
        },
      ]
    `);
}, 10_000);

it('Excludes Liquidity Mining Committee gauge', async () => {
    const liquidityMiningAddress = '0x7AA5475b2eA29a9F4a1B9Cf1cB72512D1B4Ab75e';
    const repository = new RootGaugesRepository();
    const rows = await repository.fetchOnchainRootGauges([liquidityMiningAddress]);
    expect(rows).toEqual([]);
});

it('fetches veBAL gauge as MAINNET', async () => {
    const vebalAddress = '0xE867AD0a48e8f815DC0cda2CDb275e0F163A480b';
    const repository = new RootGaugesRepository();
    const rows = await repository.fetchOnchainRootGauges([vebalAddress]);
    expect(rows).toEqual([
        {
            gaugeAddress: '0xe867ad0a48e8f815dc0cda2cdb275e0f163a480b',
            isInSubgraph: false,
            isKilled: true,
            network: 'MAINNET',
            relativeWeight: 0,
            relativeWeightCap: undefined,
        },
    ]);
});

export function aRootGauge(...options: Partial<RootGauge>[]): RootGauge {
    const defaultRootGauge: RootGauge = {
        gaugeAddress: '0x79ef6103a513951a3b25743db509e267685726b7',
        isKilled: false,
        network: 'MAINNET' as Chain,
        recipient: undefined,
        relativeWeight: 71123066693252456,
        relativeWeightCap: undefined,
        isInSubgraph: true,
    };
    return Object.assign({}, defaultRootGauge, ...options);
}

const EmptyError = new Error();

const repository = new RootGaugesRepository(prismaMock);

it('successfully saves onchain gauges', async () => {
    const rootGauge = aRootGauge({ network: Chain.OPTIMISM });

    const rootGauges = await repository.saveRootGauges([rootGauge]);

    expect(rootGauges[0]).toMatchObject(rootGauge);
    expect(rootGauges[0].stakingId).toBe(defaultStakingGaugeId);
});

describe('When staking gauge is not found ', () => {
    beforeEach(() => prismaMock.prismaPoolStakingGauge.findFirst.mockResolvedValue(null));

    it('throws when gauge is valid for voting (not killed)', async () => {
        const repository = new RootGaugesRepository(prismaMock);

        const rootGauge = aRootGauge({ network: Chain.MAINNET, isKilled: false });

        let error: Error = EmptyError;
        try {
            await repository.saveRootGauges([rootGauge]);
        } catch (e) {
            error = e as Error;
        }

        expect(error.message).toContain('RootGauge not found in PrismaPoolStakingGauge:');
    });

    it('does not throw when gauge is valid for voting (killed with no votes)', async () => {
        const rootGauge = aRootGauge({ network: Chain.MAINNET, isKilled: true, relativeWeight: 0 });

        const result = await repository.saveRootGauges([rootGauge]);

        expect(result).toBeDefined();
    });
});
