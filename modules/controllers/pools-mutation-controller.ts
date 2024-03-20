import config from '../../config';
import { prisma } from '../../prisma/prisma-client';
import { syncPools } from '../actions/pool/sync-pools';
import { syncSwaps } from '../actions/pool/sync-swaps';
import { syncTokenPairs } from '../actions/pool/sync-tokenpairs';
import { updateVolumeAndFees } from '../actions/swap/update-volume-and-fees';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getVaultSubgraphClient } from '../sources/subgraphs';
import { getViemClient } from '../sources/viem-client';
import { getVaultClient } from '../sources/contracts';

/**
 * Controller responsible for matching job requests to configured job handlers
 *
 * @param name - the name of the job
 * @param chain - the chain to run the job on
 * @returns a controller with configured job handlers
 */
export function PoolsMutationController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async loadSwapsFeesVolumeForAllPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);

            const poolsWithNewSwaps = await syncSwaps(vaultSubgraphClient, chain);
            await updateVolumeAndFees(poolsWithNewSwaps);
            return poolsWithNewSwaps;
        },
        async loadOnchainDataForAllPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                balancer: {
                    v3: { vaultAddress, routerAddress },
                },
            } = config[chain];

            // Guard against unconfigured chains
            if (!vaultAddress) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const pools = await prisma.prismaPool.findMany({
                where: { chain },
            });
            const dbIds = pools.map((pool) => pool.id.toLowerCase());
            const viemClient = getViemClient(chain);
            const vaultClient = getVaultClient(viemClient, vaultAddress);
            const blockNumber = await viemClient.getBlockNumber();

            await syncPools(dbIds, vaultClient, chain, blockNumber);
            await syncTokenPairs(dbIds, viemClient, routerAddress, chain);
            return dbIds;
        },
    };
}
