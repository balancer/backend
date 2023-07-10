import { setMainnetRpcProviderForTesting } from '../../test/utils';
import { RootGaugesRepository } from './root-gauges.repository';
import { VotingListService } from './voting-list.service';

const httpRpc = 'http://127.0.0.1:8555';
setMainnetRpcProviderForTesting(httpRpc);

it('Full flow', async () => {
    const service = new VotingListService();

    const repository = new RootGaugesRepository();
    let onchainRootAddresses: string[] = await repository.getRootGaugeAddresses();

    console.log('Number of addresses download: ', onchainRootAddresses.length);

    // Test full flow with specific addresses
    // onchainRootAddresses = ['0xb78543e00712c3abba10d0852f6e38fde2aaba4d'];

    repository.deleteRootGauges();
    await service.sync(onchainRootAddresses);
}, 1000_000);
