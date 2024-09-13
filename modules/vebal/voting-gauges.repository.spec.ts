import { Chain } from '@prisma/client';
import { VotingGauge, VotingGaugesRepository } from './voting-gauges.repository';
import { defaultStakingGaugeId, prismaMock } from './prismaPoolStakingGauge.mock';
import { MockViemClient } from '../../test/mock-viem-client';

// Create a mock viemClient
const mockViemClient = new MockViemClient();

// Create a repository instance with mocked dependencies
const repository = new VotingGaugesRepository(prismaMock, mockViemClient as any);

describe('VotingGaugesRepository', () => {
    it('maps onchain network format into prisma chain format', () => {
        expect(repository.toPrismaNetwork('Mainnet')).toBe(Chain.MAINNET);
        expect(repository.toPrismaNetwork('Optimism')).toBe(Chain.OPTIMISM);
        expect(repository.toPrismaNetwork('veBAL')).toBe(Chain.MAINNET);
        expect(repository.toPrismaNetwork('POLYGONZKEVM')).toBe(Chain.ZKEVM);
        expect(() => repository.toPrismaNetwork('Unknown')).toThrowError('Network UNKNOWN is not supported');
    });

    it('fetches list of voting gauge addresses', async () => {
        const mockAddresses = Array(373).fill('0x1234567890123456789012345678901234567890');
        mockViemClient.mockMulticallResult(mockAddresses);
        mockViemClient.mockReadContractResult('n_gauges', 373);

        const addresses = await repository.getVotingGaugeAddresses();
        expect(addresses).toHaveLength(373);
    });

    it('generates voting gauge rows given a list of gauge addresses', async () => {
        const votingGaugeAddresses = [
            '0x79eF6103A513951a3b25743DB509E267685726B7',
            '0xfb0265841C49A6b19D70055E596b212B0dA3f606',
            '0x8F7a0F9cf545DB78BF5120D3DBea7DE9c6220c10',
        ];

        mockViemClient.mockMulticallResult([false, true, false]); // isKilled
        mockViemClient.mockMulticallResult(['0.07308250729037725', '0', '0']); // relativeWeights
        mockViemClient.mockMulticallResult([undefined, undefined, '0.02']); // relativeWeightCaps
        mockViemClient.mockMulticallResult(['Ethereum', 'Optimism', 'Arbitrum']); // gaugeType names
        mockViemClient.mockMulticallResult([0, 1, 2]); // gaugeTypes
        mockViemClient.mockReadContractResult('n_gauge_types', 3);

        const rows = await repository.fetchOnchainVotingGauges(votingGaugeAddresses);

        expect(rows).toMatchSnapshot();
    });

    it('Excludes Liquidity Mining Committee gauge', async () => {
        const liquidityMiningAddress = '0x7AA5475b2eA29a9F4a1B9Cf1cB72512D1B4Ab75e';

        mockViemClient.mockMulticallResult([false]); // isKilled
        mockViemClient.mockMulticallResult(['0.01']); // relativeWeights
        mockViemClient.mockMulticallResult(['0.02']); // relativeWeightCaps
        mockViemClient.mockMulticallResult(['Liquidity Mining Committee']); // gaugeType names
        mockViemClient.mockMulticallResult([0]); // gaugeTypes
        mockViemClient.mockReadContractResult('n_gauge_types', 1);

        const rows = await repository.fetchOnchainVotingGauges([liquidityMiningAddress]);
        expect(rows).toEqual([]);
    });

    it('fetches veBAL gauge as MAINNET', async () => {
        const vebalAddress = '0xE867AD0a48e8f815DC0cda2CDb275e0F163A480b';

        mockViemClient.mockMulticallResult([true]); // isKilled
        mockViemClient.mockMulticallResult(['0']); // relativeWeights
        mockViemClient.mockMulticallResult([undefined]); // relativeWeightCaps
        mockViemClient.mockMulticallResult(['veBAL']); // gaugeTypes
        mockViemClient.mockMulticallResult([0]); // gaugeTypes
        mockViemClient.mockReadContractResult('n_gauge_types', 1);

        const rows = await repository.fetchOnchainVotingGauges([vebalAddress]);
        expect(rows).toMatchSnapshot();
    });
});

// Helper function to create a VotingGauge object
export function aVotingGauge(...options: Partial<VotingGauge>[]): VotingGauge {
    const defaultRootGauge: VotingGauge = {
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

describe('VotingGaugesRepository saving gauges', () => {
    it('successfully saves onchain gauges', async () => {
        const votingGauge = aVotingGauge({ network: Chain.OPTIMISM });

        const { votingGaugesWithStakingGaugeId: votingGauges, saveErrors } = await repository.saveVotingGauges([
            votingGauge,
        ]);

        expect(votingGauges[0]).toMatchObject(votingGauge);
        expect(votingGauges[0].stakingGaugeId).toBe(defaultStakingGaugeId);
        expect(saveErrors).toHaveLength(0);
    });

    describe('When staking gauge is not found ', () => {
        beforeEach(() => prismaMock.prismaPoolStakingGauge.findFirst.mockResolvedValue(null));

        it('has errors when gauge is valid for voting (not killed)', async () => {
            const votingGauge = aVotingGauge({ network: Chain.MAINNET, isKilled: false });

            const { saveErrors } = await repository.saveVotingGauges([votingGauge]);

            expect(saveErrors).toHaveLength(1);
            expect(saveErrors[0].message).toContain('Failed to save voting gauge');
        });

        it('does not throw when gauge is invalid for voting (killed with no votes)', async () => {
            const votingGauge = aVotingGauge({ network: Chain.MAINNET, isKilled: true, relativeWeight: 0 });

            const { votingGaugesWithStakingGaugeId, saveErrors } = await repository.saveVotingGauges([votingGauge]);

            expect(votingGaugesWithStakingGaugeId).toHaveLength(1);
            expect(votingGaugesWithStakingGaugeId[0].stakingGaugeId).toBeUndefined();
            expect(saveErrors).toHaveLength(0);
        });
    });
});
