import { getHiddenHandAPR } from './vebal-voting-apr.service';

describe('getVotingAPR', () => {
    it('should fetch the voting APR', async () => {
        const apr = await getHiddenHandAPR(0);
        console.log(apr);
        expect(apr).toBeGreaterThan(0);
    });
});
