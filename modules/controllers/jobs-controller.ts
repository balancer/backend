import config from '../../config';
import { chainIdToChain } from '../network/chain-id-to-chain';
import { getViemClient } from '../sources/viem-client';
import { syncStakingData as syncSftmxStakingData } from '../actions/sftmx/sync-staking-data';
import { Address } from 'viem';
import { syncWithdrawalRequests as syncSftmxWithdrawalRequests } from '../actions/sftmx/sync-withdrawal-requests';
import { SftmxSubgraphService } from '../sources/subgraphs/sftmx-subgraph/sftmx.service';
import { syncSftmxStakingSnapshots } from '../actions/sftmx/sync-staking-snapshots';

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
