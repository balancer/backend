import { JobsController } from './jobs-controller';
import * as actions from '@modules/actions/jobs-actions';

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
        jobsController.syncPools('11155111');

        expect(actions.syncPools).toHaveBeenCalled();
    });
});
