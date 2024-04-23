import { Address } from 'viem';
import config from '../../../config';
import { chainIdToChain } from '../../network/chain-id-to-chain';
import { getViemClient } from '../../sources/viem-client';
import { syncStakingData } from './sync-staking-data';

describe('SFTMX syncing service', () => {
    test('sync staking data', async () => {
        const chain = chainIdToChain[250];
        const stakingContractAddress = config[chain].sftmx?.stakingContractAddress;

        // Guard against unconfigured chains
        if (!stakingContractAddress) {
            throw new Error(`Chain not configured for job syncSftmxStakingData: ${chain}`);
        }

        const viemClient = getViemClient(chain);

        await syncStakingData(stakingContractAddress as Address, viemClient);
    }, 50000);
});
