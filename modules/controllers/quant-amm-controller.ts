import { Chain } from '@prisma/client';
import { getViemClient } from '../sources/viem-client';
import { syncWeights } from '../actions/quant-amm/sync-weights';

export const QuantAmmController = {
    async syncWeights(chain: Chain) {
        const client = getViemClient(chain);

        await syncWeights(client, chain);
    },
};
