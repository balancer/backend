import config from '../../config';
import { syncPools } from '../actions/pool/sync-pools';
import { upsertPools } from '../actions/pool/upsert-pools';
import { syncJoinExits } from '../actions/pool/sync-join-exits';
import { syncJoinExitsV2 } from '../actions/pool/sync-join-exits-v2';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getVaultSubgraphClient } from '../sources/subgraphs/balancer-v3-vault';
import { syncSwaps } from '../actions/pool/sync-swaps';
import { updateVolumeAndFees } from '../actions/swap/update-volume-and-fees';
import { getV3JoinedSubgraphClient } from '../sources/subgraphs';
import { prisma } from '../../prisma/prisma-client';
import { getChangedPools } from '../sources/logs/get-changed-pools';
import { syncStakingData as syncSftmxStakingData } from '../actions/sftmx/sync-staking-data';
import { Address } from 'viem';
import { syncWithdrawalRequests as syncSftmxWithdrawalRequests } from '../actions/sftmx/sync-withdrawal-requests';
import { SftmxSubgraphService } from '../sources/subgraphs/sftmx-subgraph/sftmx.service';
import { syncSftmxStakingSnapshots } from '../actions/sftmx/sync-staking-snapshots';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';

/**
 * Controller responsible for configuring and executing ETL actions, usually in the form of jobs.
 *
 * @example
 * ```ts
 * const jobsController = JobsController();
 * await jobsController.syncPools('1');
 * await jobsController.syncJoinExits('1');
 * ```
 *
 * @param name - the name of the job
 * @param chain - the chain to run the job on
 * @returns a controller with configured job handlers
 */
export function JobsController(tracer?: any) {
    // Setup tracing
    // ...
    return {
        async syncJoinExitsV2(chainId: string) {
            return true; // TODO: disable syncing because of high DB usage, probably due to USD pricing fetching

            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancer },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancer) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const subgraphClient = new BalancerSubgraphService(balancer, Number(chainId));
            const entries = await syncJoinExitsV2(subgraphClient, chain);
            return entries;
        },
        async syncJoinExitsV3(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const entries = await syncJoinExits(vaultSubgraphClient, chain);
            return entries;
        },
        /**
         * Adds new pools found in subgraph to the database
         *
         * @param chainId
         */
        async addPools(chainId: string) {
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
            const latestBlock = await viemClient.getBlockNumber();

            await upsertPools(newPools, viemClient, vaultAddress, chain, latestBlock);
        },
        /**
         * Takes all the pools from subgraph, enriches with onchain data and upserts them to the database
         *
         * @param chainId
         */
        async reloadPools(chainId: string) {
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

            const client = getV3JoinedSubgraphClient(balancerV3, balancerPoolsV3);
            const allPools = await client.getAllInitializedPools();

            const viemClient = getViemClient(chain);
            const latestBlock = await viemClient.getBlockNumber();

            await upsertPools(allPools, viemClient, vaultAddress, chain, latestBlock);
        },
        /**
         * Syncs database pools state with the onchain state
         *
         * @param chainId
         */
        async syncPools(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                balancer: {
                    v3: { vaultAddress },
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

            const { changedPools, latestBlock } = await getChangedPools(vaultAddress, viemClient, BigInt(fromBlock));
            const ids = changedPools.filter((id) => dbIds.includes(id.toLowerCase())); // only sync pools that are in the database
            if (ids.length === 0 || !latestBlock) {
                return [];
            }
            return syncPools(ids, viemClient, vaultAddress, chain, latestBlock + 1n);
        },
        async syncSwapsV3(chainId: string) {
            const chain = chainIdToChain[chainId];
            const {
                subgraphs: { balancerV3 },
            } = config[chain];

            // Guard against unconfigured chains
            if (!balancerV3) {
                throw new Error(`Chain not configured: ${chain}`);
            }

            const vaultSubgraphClient = getVaultSubgraphClient(balancerV3);
            const entries = await syncSwaps(vaultSubgraphClient, chain);
            return entries;
        },
        // TODO also update yieldfee
        // TODO maybe update fee from onchain instead of swap?
        async syncSwapsUpdateVolumeAndFees(chainId: string) {
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
        async syncSftmxStakingData(chainId: string) {
            const chain = chainIdToChain[chainId];
            const stakingContractAddress = config[chain].sftmx?.stakingContractAddress;

            // Guard against unconfigured chains
            if (!stakingContractAddress) {
                throw new Error(`Chain not configured for job syncSftmxStakingData: ${chain}`);
            }

            const viemClient = getViemClient(chain);

            await syncSftmxStakingData(stakingContractAddress as Address, viemClient);
        },
        async syncSftmxWithdrawalrequests(chainId: string) {
            const chain = chainIdToChain[chainId];
            const sftmxSubgraphUrl = config[chain].subgraphs.sftmx;
            const stakingContractAddress = config[chain].sftmx?.stakingContractAddress;

            // Guard against unconfigured chains
            if (!sftmxSubgraphUrl || !stakingContractAddress) {
                throw new Error(`Chain not configured for job syncSftmxWithdrawalrequests: ${chain}`);
            }

            const sftmxSubgraphClient = new SftmxSubgraphService(sftmxSubgraphUrl);

            await syncSftmxWithdrawalRequests(stakingContractAddress as Address, sftmxSubgraphClient);
        },
        async syncSftmxStakingSnapshots(chainId: string) {
            const chain = chainIdToChain[chainId];
            const sftmxSubgraphUrl = config[chain].subgraphs.sftmx;
            const stakingContractAddress = config[chain].sftmx?.stakingContractAddress;

            // Guard against unconfigured chains
            if (!sftmxSubgraphUrl || !stakingContractAddress) {
                throw new Error(`Chain not configured for job syncSftmxStakingSnapshots: ${chain}`);
            }

            const sftmxSubgraphClient = new SftmxSubgraphService(sftmxSubgraphUrl);

            await syncSftmxStakingSnapshots(stakingContractAddress as Address, sftmxSubgraphClient);
        },
    };
}
