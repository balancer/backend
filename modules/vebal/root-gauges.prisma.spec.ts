import { Chain } from '@prisma/client';
import { Address } from 'viem';
import { defaultStakingGaugeId, prismaMock } from './prismaPoolStakingGauge.mock';
import { RootGauge } from './root-gauges.onchain';
import { PrismaRootGauges } from './root-gauges.prisma';

export function aRootGauge(...options: Partial<RootGauge>[]): RootGauge {
    const defaultRootGauge: RootGauge = {
        gaugeAddress: '0x79ef6103a513951a3b25743db509e267685726b7' as Address,
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

const repository = new PrismaRootGauges(prismaMock);
it('successfully saves onchain gauges', async () => {
    const rootGauge = aRootGauge({ network: Chain.OPTIMISM });
    const rootGauges = await repository.saveRootGauges([rootGauge]);

    expect(rootGauges[0]).toMatchObject(rootGauge);
    expect(rootGauges[0].stakingId).toBe(defaultStakingGaugeId);
});

describe('When staking gauge is not found ', () => {
    beforeEach(() => prismaMock.prismaPoolStakingGauge.findFirst.mockResolvedValue(null));

    it('throws when gauge is valid for voting (not killed)', async () => {
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
