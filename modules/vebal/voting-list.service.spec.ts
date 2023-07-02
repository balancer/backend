import { Chain } from '@prisma/client';
import { Address } from 'viem';
import { VotingListService } from './voting-list.service';

it('generates root gauge rows given a list of gauge addresses', async () => {
    const service = new VotingListService();
    const rootGauge = {
        gaugeAddress: '0x79ef6103a513951a3b25743db509e267685726b7' as Address,
        isKilled: false,
        network: 'MAINNET' as Chain,
        recipient: undefined,
        relativeWeight: 71123066693252456,
        relativeWeightCap: undefined,
    };

    const rootGauges = await service.saveRootGauges([rootGauge]);

    expect(rootGauges).toMatchInlineSnapshot(`
      [
        {
          "gaugeAddress": "0x79ef6103a513951a3b25743db509e267685726b7",
          "id": "0x79ef6103a513951a3b25743db509e267685726b7",
          "isKilled": false,
          "network": "MAINNET",
          "recipient": undefined,
          "relativeWeight": 71123066693252456,
          "relativeWeightCap": undefined,
        },
      ]
    `);
});
