import config from '../../config';
import { prisma } from '../../prisma/prisma-client';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getCowAmmSubgraphClient } from '../sources/subgraphs';
import { fetchChangedPools, fetchNewPools, syncPools, upsertPools } from '../actions/cow-amm';
import { getChangedCowAmmPools } from '../sources/logs/get-changed-cow-amm-pools';

export function CowAmmController(tracer?: any) {
    return {
        /**
         * Adds new pools found in subgraph to the database
         *
         * @param chainId
         */
        async addPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { cowAmm },
            } = config[chain];

            // Guard against unconfigured chains
            if (!cowAmm) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const subgraphClient = getCowAmmSubgraphClient(cowAmm);
            const newPools = await fetchNewPools(subgraphClient, chain);
            const viemClient = getViemClient(chain);

            const ids = await upsertPools(newPools, viemClient, subgraphClient, chain);

            return ids;
        },
        /**
         * Takes all the pools from subgraph, enriches with onchain data and upserts them to the database
         *
         * @param chainId
         */
        async reloadPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { cowAmm },
            } = config[chain];

            // Guard against unconfigured chains
            if (!cowAmm) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const subgraphClient = getCowAmmSubgraphClient(cowAmm);
            const allPools = await subgraphClient.getAllPools({});
            const viemClient = getViemClient(chain);

            await upsertPools(
                allPools.map((pool) => pool.id),
                viemClient,
                subgraphClient,
                chain,
            );

            return allPools.map((pool) => pool.id);
        },
        /**
         * Syncs database pools state with the onchain state, based on the events
         *
         * @param chainId
         */
        async syncPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const viemClient = getViemClient(chain);
            const { changedPools, latestBlock } = await fetchChangedPools(viemClient, chain);

            if (changedPools.length === 0) {
                return [];
            }

            await syncPools(changedPools, viemClient, chain, latestBlock);
            return changedPools;
        },
    };
}
