import { Chain } from '@prisma/client';
import { getViemClient } from '../sources/viem-client';
import { syncData } from '../actions/lbp/sync-data';
import config from '../../config';
import { syncDataFixedLBP } from '../actions/lbp/sync-data-fixedLBP';

export const LBPController = {
    async syncData(chain: Chain) {
        const client = getViemClient(chain);
        const vaultAddress = config[chain].balancer.v3.vaultAddress;
        if (!vaultAddress) return;

        await syncData(chain, client, vaultAddress);
    },
    async syncDataFixedLBP(chain: Chain) {
        const client = getViemClient(chain);

        await syncDataFixedLBP(chain, client);
    },
};
