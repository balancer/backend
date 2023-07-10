import { setMainnetRpcProviderForTesting } from '../../test/utils';
import { PrismaRootGauges } from './root-gauges.db';
import { OnChainRootGauges } from './root-gauges.onchain';
import { VotingListService } from './voting-list.service';

it('Full flow', async () => {
    const httpRpc = 'http://127.0.0.1:8555';
    const service = new VotingListService();
    setMainnetRpcProviderForTesting(httpRpc);

    const onchainRootGauges = new OnChainRootGauges();
    let onchainRootAddresses: string[] = await onchainRootGauges.getRootGaugeAddresses();

    console.log('Number of addresses download: ', onchainRootAddresses.length);

    // Test full flow with specific addresses
    // onchainRootAddresses = ['0xb78543e00712c3abba10d0852f6e38fde2aaba4d'];

    new PrismaRootGauges().deleteRootGauges();
    await service.sync(onchainRootAddresses);
}, 1000_000);
