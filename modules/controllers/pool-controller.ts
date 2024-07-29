import config from '../../config';
import { syncPools } from '../actions/pool/sync-pools';
import { upsertPools } from '../actions/pool/upsert-pools';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getVaultSubgraphClient } from '../sources/subgraphs/balancer-v3-vault';
import { getBlockNumbersSubgraphClient, getV3JoinedSubgraphClient } from '../sources/subgraphs';
import { prisma } from '../../prisma/prisma-client';
import { getChangedPools } from '../sources/logs/get-changed-pools';
import { getVaultClient } from '../sources/contracts';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';
import { updateLiquidity24hAgo } from '../actions/pool/update-liquidity-24h-ago';
import { syncTokenPairs } from '../actions/pool/sync-tokenpairs';
import { Chain } from '@prisma/client';

export function PoolController() {
    return {
        /**
         * Adds new pools found in subgraph to the database
         *
         * @param chainId
         */
        async addPoolsV3(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3, balancerPoolsV3 },
                balancer: {
                    v3: { vaultAddress },
                },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3 || !balancerPoolsV3 || !vaultAddress) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const pools = await prisma.prismaPool.findMany({
                where: { chain },
            });
            const ids = pools.map((pool) => pool.id);
            if (ids.length === 0) ids.push('');
            const client = getV3JoinedSubgraphClient(balancerV3, balancerPoolsV3);
            const newPools = await client.getAllInitializedPools({ id_not_in: ids });

            const viemClient = getViemClient(chain);
            const vaultClient = getVaultClient(viemClient, vaultAddress);
            const latestBlock = await viemClient.getBlockNumber();

            await upsertPools(
                newPools.sort((a, b) => parseFloat(a.blockTimestamp) - parseFloat(b.blockTimestamp)),
                vaultClient,
                chain,
                latestBlock,
            );
        },
        /**
         * Takes all the pools from subgraph, enriches with onchain data and upserts them to the database
         *
         * @param chainId
         */
        async reloadPoolsV3(chain: Chain) {
            const {
                subgraphs: { balancerV3, balancerPoolsV3 },
                balancer: {
                    v3: { vaultAddress },
                },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3 || !balancerPoolsV3 || !vaultAddress) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const client = getV3JoinedSubgraphClient(balancerV3, balancerPoolsV3);
            const allPools = await client.getAllInitializedPools();

            const viemClient = getViemClient(chain);
            const vaultClient = getVaultClient(viemClient, vaultAddress);
            const latestBlock = await viemClient.getBlockNumber();

            await upsertPools(allPools, vaultClient, chain, latestBlock);
            await syncPools(
                allPools.map((pool) => pool.id),
                vaultClient,
                chain,
                latestBlock,
            );
        },
        /**
         * Syncs database pools state with the onchain state
         *
         * @param chainId
         */
        async syncPoolsV3(chainId: string) {
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

            const fromBlock = (
                await prisma.prismaPoolDynamicData.findFirst({
                    where: { chain: chain },
                    orderBy: { blockNumber: 'desc' },
                })
            )?.blockNumber;

            // Sepolia vault deployment block, uncomment to test from the beginning
            // const fromBlock = 5274748n;

            // Guard against unsynced pools
            if (!fromBlock) {
                throw new Error(`No synced pools found for chain: ${chain}`);
            }

            const pools = await prisma.prismaPool.findMany({
                where: { chain },
            });
            const dbIds = pools.map((pool) => pool.id.toLowerCase());
            const viemClient = getViemClient(chain);
            const vaultClient = getVaultClient(viemClient, vaultAddress);

            const { changedPools, latestBlock } = await getChangedPools(vaultAddress, viemClient, BigInt(fromBlock));
            const ids = changedPools.filter((id) => dbIds.includes(id.toLowerCase())); // only sync pools that are in the database
            if (ids.length === 0) {
                return [];
            }
            await syncPools(ids, vaultClient, chain, latestBlock);
            await syncTokenPairs(ids, viemClient, routerAddress, chain);
            return ids;
        },
        async updateLiquidity24hAgo(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3, balancer, blocks },
            } = config[chain];

            // Guard against unconfigured chains
            const subgraph =
                (balancerV3 && getVaultSubgraphClient(balancerV3)) ||
                (balancer && getV2SubgraphClient(balancer, Number(chainId)));

            if (!subgraph) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const blocksSubgraph = getBlockNumbersSubgraphClient(blocks);

            const poolIds = await prisma.prismaPoolDynamicData.findMany({
                where: { chain },
                select: { poolId: true },
            });

            const updates = await updateLiquidity24hAgo(
                poolIds.map(({ poolId }) => poolId),
                subgraph,
                blocksSubgraph,
                chain,
            );

            return updates;
        },
    };
}
