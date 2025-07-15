import { Chain } from '@prisma/client';
import { getViemClient } from '../sources/viem-client';
import { syncData } from '../actions/lbp/sync-data';
import config from '../../config';
import { getVaultSubgraphClient } from '../sources/subgraphs';

export const LBPController = {
    async syncData(chain: Chain) {
        const client = getViemClient(chain);
        const subgraphUrl = config[chain].subgraphs.balancerV3;
        if (!subgraphUrl) return;
        const subgraphClient = getVaultSubgraphClient(subgraphUrl, chain);

        await syncData(chain, client, subgraphClient);
    },
};
