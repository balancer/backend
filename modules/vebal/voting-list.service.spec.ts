import { Chain } from '@prisma/client';
import { Address } from 'viem';
import { VotingListService } from './voting-list.service';
import { defaultStakingGaugeId, prismaMock } from './prismaPoolStakingGauge.mock';
import { OnChainRootGauges, RootGauge } from './root-gauges.onchain';
import { createHttpClient } from '../network/viem/clients';

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

it('saves onchain gauges in database', async () => {
    const service = new VotingListService(prismaMock);

    const rootGauge = aRootGauge({ network: Chain.OPTIMISM });
    const rootGauges = await service.saveRootGauges([rootGauge]);

    expect(rootGauges[0]).toMatchObject(rootGauge);
    expect(rootGauges[0].stakingId).toBe(defaultStakingGaugeId);
});

it('throws when root gauge is not found is staking gauges table', async () => {
    prismaMock.prismaPoolStakingGauge.findFirstOrThrow.mockRejectedValue('Gauge not found');

    const service = new VotingListService(prismaMock);

    const saveRootGauges = () => service.saveRootGauges([aRootGauge()]);

    expect(saveRootGauges).rejects.toThrowError('Gauge not found');
});

//DEBUG TEST DELETE LATER
it.only('saves onchain gauges in database', async () => {
    const service = new VotingListService();
    const httpRpc = 'http://127.0.0.1:8555';
    console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
    const testHttpClient = createHttpClient(httpRpc);
    const gaugesRepo = new OnChainRootGauges(testHttpClient);
    const addresses = [
        // '0x78a54C8F4eAba82e45cBC20B9454a83CB296e09E',
        // '0xecF0a26a290cbf3DDBAB7eC5Fb44Ef5A294cAc18',
        // '0x21cf9324D5B1AC739B7E6922B69500F1eEDB52e0',
        // '0x5b79494824Bc256cD663648Ee1Aad251B32693A9', //veUSH
        // '0xa8D974288Fe44ACC329D7d7a179707D27Ec4dd1c',
        // '0x69F1077AeCE23D5b0344330B5eB13f05d5e410a1',
        // '0xc43bF12A008d3Cc48AF7da1e8e87622A78dc64da',
        // '0xc4b6cc9A444337b1Cb8cBbDD9de4d983f609C391',
        // '0xFa58735ceEAa83a7c9c13CA771F12378D40D7b05',
        // '0x8F7a0F9cf545DB78BF5120D3DBea7DE9c6220c10',
        // '0x6E7B9A1746a7eD4b23edFf0975B726E5aA673E21',
        // '0x6F3b31296FD2457eba6Dca3BED65ec79e06c1295',
        //'0xb78543e00712C3ABBA10D0852f6E38FDE2AaBA4d', ////veBAL
        '0xf8C85bd74FeE26831336B51A90587145391a27Ba', // GNOSIS with ethers type
        // '0x7F75ecd3cFd8cE8bf45f9639A226121ca8bBe4ff',
        // '0xc61e7E858b5a60122607f5C7DF223a53b01a1389',
        // '0xbf65b3fA6c208762eD74e82d4AEfCDDfd0323648',
        // '0xD449Efa0A587f2cb6BE3AE577Bc167a774525810',
        // '0xd758454BDF4Df7Ad85f7538DC9742648EF8e6d0A',
        // '0xd8191A3496a1520c2B5C81D04B26F8556Fc62d7b',
    ];
    const onchainRootGauges = await gaugesRepo.fetchOnchainRootGauges(addresses as Address[]);

    const rootGauges = await service.saveRootGauges(onchainRootGauges);

    // 0xf8C85bd74FeE26831336B51A90587145391a27Ba
    // {
    //     id: '0xf8c85bd74fee26831336b51a90587145391a27ba',
    //     chain: 'GNOSIS',
    //     status: 'ACTIVE',
    //     gaugeAddress: '0xf8c85bd74fee26831336b51a90587145391a27ba',
    //     stakingId: '0xde3b7ec86b67b05d312ac8fd935b6f59836f2c41',
    //     relativeWeight: '3027203445421663',
    //     relativeWeightCap: '1'
    //   }
    // pool 0xfedb19ec000d38d92af4b21436870f115db22725000000000000000000000010
    // stakingId 0xde3b7ec86b67b05d312ac8fd935b6f59836f2c41
    // https://etherscan.io/address/0xf8C85bd74FeE26831336B51A90587145391a27Ba#readContract
    // recipient es 0x27519F69b2Ac912aeb6fE066180FB25a17c71755

    // 0x7F75ecd3cFd8cE8bf45f9639A226121ca8bBe4ff
    // {
    //     id: '0x7f75ecd3cfd8ce8bf45f9639a226121ca8bbe4ff',
    //     chain: 'GNOSIS',
    //     status: 'ACTIVE',
    //     gaugeAddress: '0x7f75ecd3cfd8ce8bf45f9639a226121ca8bbe4ff',
    //     stakingId: '0xde3b7ec86b67b05d312ac8fd935b6f59836f2c41',
    //     relativeWeight: '1513601722710829',
    //     relativeWeightCap: '1'
    //   }
    // pool 0xbad20c15a773bf03ab973302f61fabcea5101f0a000000000000000000000034

    console.log('Saved all root gauges!!');
});
