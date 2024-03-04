import { syncPools } from '../actions/pool/sync-pools';
import { JobsController } from './jobs-controller';

// Mock the action
jest.mock('../actions/pool/sync-pools', () => ({
    syncPools: jest.fn(),
}));

// Mock the clients
jest.mock('../sources/viem-client', () => ({
    getViemClient: jest.fn().mockReturnValue({
        getBlockNumber: jest.fn().mockResolvedValue(1),
    }),
}));

describe('jobsController', () => {
    const jobsController = JobsController();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call syncPools', async () => {
        await jobsController.syncPools(['11155111']);

        expect(syncPools).toHaveBeenCalled();
    });
});
