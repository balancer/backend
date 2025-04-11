import { Chain } from '@prisma/client';
import { getViemClient } from '../sources/viem-client';
import { syncWeights } from '../actions/lbp/sync-weights';

export const LBPController = {
    async syncWeights(chain: Chain) {
        const client = getViemClient(chain);

        await syncWeights(client, chain);
    },
};
