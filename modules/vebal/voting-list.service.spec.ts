import { mainnetNetworkConfig } from '../network/mainnet';
import { createHttpClient } from '../network/viem/clients';
import { OnChainRootGauges } from './root-gauges.onchain';
import { PrismaRootGauges } from './root-gauges.prisma';
import { VotingListService } from './voting-list.service';

it.skip('Full flow', async () => {
    const httpRpc = 'http://127.0.0.1:8555';
    // const httpRpc = '';
    console.log(`🤖 Integration tests using ${httpRpc} as rpc url`);
    const testHttpClient = createHttpClient(httpRpc);
    mainnetNetworkConfig.publicClient = testHttpClient;
    const service = new VotingListService();

    const onchainRootGauges = new OnChainRootGauges(testHttpClient);
    let onchainRootAddresses: string[] = await onchainRootGauges.getRootGaugeAddresses();

    console.log('Number of addresses download: ', onchainRootAddresses.length);

    // Test full flow with specific addresses
    // onchainRootAddresses = ['0xb78543e00712c3abba10d0852f6e38fde2aaba4d'];

    new PrismaRootGauges().deleteRootGauges();
    await service.sync(onchainRootAddresses);
}, 1000_000);
