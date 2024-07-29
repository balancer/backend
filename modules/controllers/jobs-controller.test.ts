import { syncPools } from '../actions/pool/sync-pools';
import { PoolController } from '../controllers/pool-controller'; // Add this import statement

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

describe('poolController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call syncPools', async () => {
        await PoolController().syncPoolsV3('11155111');

        expect(syncPools).toHaveBeenCalled();
    });
});
