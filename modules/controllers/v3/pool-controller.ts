import config from '../../../config';
import { syncPools } from '../../actions/pool/v3/sync-pools';
import { syncHookData } from '../../actions/pool/v3/sync-hook-data';
import { upsertPools } from '../../actions/pool/v3/upsert-pools';
import { getViemClient } from '../../sources/viem-client';
import { getVaultSubgraphClient } from '../../sources/subgraphs/balancer-v3-vault';
import { getBlockNumbersSubgraphClient, getV3JoinedSubgraphClient } from '../../sources/subgraphs';
import { prisma } from '../../../prisma/prisma-client';
import { getChangedPools } from '../../sources/logs/get-changed-pools';
import { getVaultClient } from '../../sources/contracts';
import { updateLiquidity24hAgo } from '../../actions/pool/update-liquidity-24h-ago';
import { syncTokenPairs } from '../../actions/pool/v3/sync-tokenpairs';
import { Chain } from '@prisma/client';
import { HookType } from '../../network/network-config-types';

export function PoolController() {
    return {
        /**
         * Adds new pools found in subgraph to the database
         *
         * @param chain
         */
        async addPoolsV3(chain: Chain) {
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

            const added = await upsertPools(
                newPools.sort((a, b) => parseFloat(a.blockTimestamp) - parseFloat(b.blockTimestamp)),
                vaultClient,
                chain,
                latestBlock,
            );

            return added.map(({ id }) => id);
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

            const pools = await upsertPools(allPools, vaultClient, chain, latestBlock);
            await syncPools(pools, viemClient, vaultAddress, chain, latestBlock);

            return pools.map(({ id }) => id);
        },
        /**
         * Syncs database pools state with the onchain state
         *
         * @param chainId
         */
        async syncPoolsV3(chain: Chain) {
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
                where: { chain, protocolVersion: 3 },
            });
            const viemClient = getViemClient(chain);

            const { changedPools, latestBlock } = await getChangedPools(vaultAddress, viemClient, BigInt(fromBlock));
            const changedPoolsIds = changedPools.map((id) => id.toLowerCase());
            const poolsToSync = pools.filter((pool) => changedPoolsIds.includes(pool.id.toLowerCase())); // only sync pools that are in the database
            if (poolsToSync.length === 0) {
                return [];
            }
            await syncPools(poolsToSync, viemClient, vaultAddress, chain, latestBlock);
            await syncTokenPairs(
                poolsToSync.map(({ id }) => id),
                viemClient,
                routerAddress,
                chain,
            );

            return poolsToSync.map(({ id }) => id);
        },
        async updateLiquidity24hAgoV3(chain: Chain) {
            const {
                subgraphs: { balancerV3, blocks },
            } = config[chain];

            // Guard against unconfigured chains
            const subgraph = balancerV3 && getVaultSubgraphClient(balancerV3);

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
        async syncHookData(chain: Chain) {
            const { hooks } = config[chain];

            // Guard against unconfigured chains
            if (!hooks) {
                // Chain doesn't have hooks
                return;
            }

            // Get hook addresses from the database
            const addresses = await prisma.hook
                .findMany({
                    where: { chain },
                    select: { address: true },
                })
                .then((hooks) => hooks.map(({ address }) => address));

            // Map hooks to their config names
            const mappedHooks = addresses.reduce((acc, address) => {
                // find key in config object that has the same value as address
                const keys = Object.keys(hooks) as HookType[];
                const key = keys.find((key) => hooks[key]?.includes(address));
                if (key) {
                    acc[address] = key;
                }
                return acc;
            }, {} as Record<string, HookType>);

            const viemClient = getViemClient(chain);

            await syncHookData(mappedHooks, viemClient, chain);
        },
    };
}
