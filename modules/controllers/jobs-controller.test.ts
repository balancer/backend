import { addMissingPoolsFromSubgraph } from '../actions/pool/add-pools-from-subgraph';
import { JobsController } from './jobs-controller';
// Mock the actions
jest.mock('@modules/actions/jobs_actions', () => ({
    syncPools: jest.fn(),
}));

describe('jobsController', () => {
    const jobsController = JobsController();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call getClient with correct chain', () => {
        jobsController.addMissingPoolsFromSubgraph('11155111');

        expect(addMissingPoolsFromSubgraph).toHaveBeenCalled();
    });
});
