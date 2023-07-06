import { difference } from 'lodash';
import { createHttpClient } from '../network/viem/clients';
import oldVotingGauges from './abi/voting-gauges.json';
import { OnChainRootGauges, specialRootGaugeAddresses } from './root-gauges.onchain';
import { VotingListService } from './voting-list.service';

it('Full flow', async () => {
    const httpRpc = 'http://127.0.0.1:8555';
    // const httpRpc = '';
    console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
    const testHttpClient = createHttpClient(httpRpc);
    const service = new VotingListService();

    const onchainRootGauges = new OnChainRootGauges(testHttpClient);
    let onchainRootAddresses: string[] = (await onchainRootGauges.getRootGaugeAddresses()).map((address) =>
        address.toLowerCase(),
    );

    // onchainRootAddresses = [...extraGaugeAddresses, ...onchainRootAddresses];

    console.log('Number of addresses download: ', onchainRootAddresses.length);

    // console.log('Addresses ', JSON.stringify(onchainRootAddresses));

    onchainRootAddresses = ['0x56124eb16441a1ef12a4ccaeabdd3421281b795a'];

    await service.sync(onchainRootAddresses);
}, 1000_000);

it.only('Voting list', async () => {
    const service = new VotingListService();

    const killedWithNoVotes = [
        // Compare with call to veBalHelper just in case it has different results of getRelativeWeight
        '0x56a65cc666bfe538c5a031942369f6f63eb42240', //GNOSIS
        '0xa5a0b6598b90d214eaf4d7a6b72d5a89c3b9a72c', //POLYGON
        '0x88d07558470484c03d3bb44c3ecc36cafcf43253', //POLYGON
        '0xc3bb46b8196c3f188c6a373a6c4fde792ca78653', //POLYGON
        '0xab6efd2882bb25c732bf0a5f8d98be752f0ddaaf', //POLYGON
        '0x397649ff00de6d90578144103768aaa929ef683d', //POLYGON
        '0xf01541837cf3a64bc957f53678b0ab113e92911b', //POLYGON
        '0xcf5938ca6d9f19c73010c7493e19c02acfa8d24d', //POLYGON
        '0xf7c3b4e1edcb00f0230bfe03d937e26a5e654fd4', //POLYGON
        '0x2c967d6611c60274db45e0bb34c64fb5f504ede7', //POLYGON
        '0xe77239359ce4d445fed27c17da23b8024d35e456', //POLYGON
        '0xf0d887c1f5996c91402eb69ab525f028dd5d7578', //POLYGON
        '0x90437a1d2f6c0935dd6056f07f05c068f2a507f9', //POLYGON
        '0xbd734b38f2dc864fe00df51fc4f17d310ed7da4d', //POLYGON
        '0x359ea8618c405023fc4b98dab1b01f373792a126', //ARBITRUM
        '0x6823dca6d70061f2ae2aaa21661795a2294812bf', //ARBITRUM
        '0x6f825c8bbf67ebb6bc35cf2071dacd2864c3258e', //ARBITRUM
        '0x87ae77a8270f223656d9dc40ad51aabfab424b30', //ARBITRUM
        '0x519cce718fcd11ac09194cff4517f12d263be067', //ARBITRUM
        '0x19ff30f9b2d32bfb0f21f2db6c6a3a8604eb8c2b', //ARBITRUM
        '0xad2632513bfd805a63ad3e38d24ee10835877d41', //ARBITRUM
    ].map((address) => address.toLowerCase());

    const ignoredOldGauges = [
        '0xf0f572ad66baacDd07d8c7ea3e0E5EFA56a76081',
        '0xF2ca6F8961e91F1ee0D688F9926183314D866f1E',
    ].map((address) => address.toLowerCase());

    const oldIds = oldVotingGauges
        .map((gauge) => gauge.address.toLowerCase())
        .filter((address) => !specialRootGaugeAddresses.includes(address))
        .filter((address) => !ignoredOldGauges.includes(address))
        .filter((address) => !killedWithNoVotes.includes(address));

    const result = await service.getValidVotingRootGauges();
    const newIds = result
        .map((gauge) => gauge.gaugeAddress.toLowerCase())
        .filter((address) => !specialRootGaugeAddresses.includes(address));

    console.log('Old Ids', oldIds.length);
    console.log('New Ids', newIds.length);

    const diff = difference(oldIds, newIds);
    console.log('Missing gauge addresses: ', diff);
    console.log('Missing lengths:', diff.length);
});
