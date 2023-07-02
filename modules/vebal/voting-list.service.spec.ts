import { Chain } from '@prisma/client';
import { Address } from 'viem';
import { VotingListService } from './voting-list.service';
import { defaultStakingGaugeId, prismaMock } from './prismaPoolStakingGauge.mock';
import { RootGauge } from './root-gauges.onchain';

export function aRootGauge(...options: Partial<RootGauge>[]): RootGauge {
    const defaultRootGauge: RootGauge = {
        gaugeAddress: '0x79ef6103a513951a3b25743db509e267685726b7' as Address,
        isKilled: false,
        network: 'MAINNET' as Chain,
        recipient: undefined,
        relativeWeight: 71123066693252456,
        relativeWeightCap: undefined,
    };
    return Object.assign({}, defaultRootGauge, ...options);
}

it.only('saves onchain gauges in database', async () => {
    const service = new VotingListService(prismaMock);

    const rootGauge = aRootGauge({ network: Chain.OPTIMISM });
    const rootGauges = await service.saveRootGauges([rootGauge]);

    expect(rootGauges[0]).toMatchObject(rootGauge);
    expect(rootGauges[0].id).toBe(defaultStakingGaugeId);
});

it('throws when root gauge is not found is staking gauges table', async () => {
    prismaMock.prismaPoolStakingGauge.findFirstOrThrow.mockRejectedValue('Gauge not found');

    const service = new VotingListService(prismaMock);

    const saveRootGauges = () => service.saveRootGauges([aRootGauge()]);

    expect(saveRootGauges).rejects.toThrowError('Gauge not found');
});
