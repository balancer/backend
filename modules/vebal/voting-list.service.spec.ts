import { Chain } from '@prisma/client';
import { Address } from 'viem';
import { VotingListService } from './voting-list.service';
import { defaultStakingGaugeId, prismaMock } from './prismaPoolStakingGauge.mock';
import { RootGauge } from './root-gauges.onchain';

it('saves onchain gauges in database', async () => {
    const service = new VotingListService(prismaMock);
    const rootGauge = {
        gaugeAddress: '0x79ef6103a513951a3b25743db509e267685726b7' as Address,
        isKilled: false,
        network: 'MAINNET' as Chain,
        recipient: undefined,
        relativeWeight: 71123066693252456,
        relativeWeightCap: undefined,
    };

    const rootGauges = await service.saveRootGauges([rootGauge]);

    expect(rootGauges).toEqual([
        {
            gaugeAddress: '0x79ef6103a513951a3b25743db509e267685726b7',
            id: defaultStakingGaugeId,
            isKilled: false,
            network: 'MAINNET',
            recipient: undefined,
            relativeWeight: 71123066693252456,
            relativeWeightCap: undefined,
        },
    ]);
});

it('throws when root gauge is not found is staking gauges table', async () => {
    prismaMock.prismaPoolStakingGauge.findFirstOrThrow.mockRejectedValue('Gauge not found');

    const service = new VotingListService(prismaMock);
    const rootGauge = {
        network: 'FOO' as Chain,
    } as unknown as RootGauge;

    const saveRootGauges = () => service.saveRootGauges([rootGauge]);

    expect(saveRootGauges).rejects.toThrowError('Gauge not found');
});
