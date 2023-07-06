import { createHttpClient } from '../network/viem/clients';
import { OnChainRootGauges } from './root-gauges.onchain';
import { VotingListService } from './voting-list.service';

it.skip('Full flow', async () => {
    const httpRpc = 'http://127.0.0.1:8555';
    // const httpRpc = '';
    console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
    const testHttpClient = createHttpClient(httpRpc);
    const service = new VotingListService();

    const onchainRootGauges = new OnChainRootGauges(testHttpClient);
    let onchainRootAddresses: string[] = await onchainRootGauges.getRootGaugeAddresses();

    console.log('Number of addresses download: ', onchainRootAddresses.length);

    // Test full flow with specific addresses
    onchainRootAddresses = ['0x56124eb16441a1ef12a4ccaeabdd3421281b795a'];

    await service.sync(onchainRootAddresses);
}, 1000_000);
