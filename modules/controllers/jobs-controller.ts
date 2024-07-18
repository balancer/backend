import config from '../../config';
import { syncPools } from '../actions/pool/sync-pools';
import { upsertPools } from '../actions/pool/upsert-pools';
import { syncJoinExits } from '../actions/pool/sync-join-exits';
import { syncJoinExitsV2 } from '../actions/pool/sync-join-exits-v2';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { getVaultSubgraphClient } from '../sources/subgraphs/balancer-v3-vault';
import { syncSwapsV2 } from '../actions/pool/sync-swaps-v2';
import { syncSwapsV3 } from '../actions/pool/sync-swaps-v3';
import { updateVolumeAndFees } from '../actions/swap/update-volume-and-fees';
import { getBlockNumbersSubgraphClient, getV3JoinedSubgraphClient } from '../sources/subgraphs';
import { prisma } from '../../prisma/prisma-client';
import { getChangedPools } from '../sources/logs/get-changed-pools';
import { syncStakingData as syncSftmxStakingData } from '../actions/sftmx/sync-staking-data';
import { Address } from 'viem';
import { syncWithdrawalRequests as syncSftmxWithdrawalRequests } from '../actions/sftmx/sync-withdrawal-requests';
import { SftmxSubgraphService } from '../sources/subgraphs/sftmx-subgraph/sftmx.service';
import { syncSftmxStakingSnapshots } from '../actions/sftmx/sync-staking-snapshots';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { getVaultClient } from '../sources/contracts';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';
import { updateLiquidity24hAgo } from '../actions/pool/update-liquidity-24h-ago';
import { syncTokenPairs } from '../actions/pool/sync-tokenpairs';

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
    return {
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
