import { Chain } from '@prisma/client';
import { getChangedAddresses } from '../../sources/logs/get-changed-addresses';
import config from '../../../config';
import { getViemClient } from '../../sources/viem-client';
import { getLastSyncedBlock, upsertLastSyncedBlock } from '../../actions/last-synced-block';
import { last } from 'lodash';

const poolStateEventsV2 = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'bool',
                name: 'paused',
                type: 'bool',
            },
        ],
        name: 'PausedStateChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'bool',
                name: 'enabled',
                type: 'bool',
            },
        ],
        name: 'RecoveryModeStateChanged',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'swapFeePercentage',
                type: 'uint256',
            },
        ],
        name: 'SwapFeePercentageChanged',
        type: 'event',
    },
] as const;

export const poolsWithStateUpdates = async (chain: Chain, poolAddresses: string[]) => {
    const lastSyncedBlock = await getLastSyncedBlock(chain, 'STATE_EVENTS_V2');

    const viemClient = getViemClient(chain);
    const latestBlock = await viemClient.getBlockNumber();
    if (lastSyncedBlock >= latestBlock) {
        return [];
    }

    const poolWithStateChanges = await getChangedAddresses(
        poolAddresses,
        poolStateEventsV2,
        getViemClient(chain),
        lastSyncedBlock + 1,
        Number(latestBlock),
        config[chain].rpcMaxBlockRange,
    );

    await upsertLastSyncedBlock(chain, 'STATE_EVENTS_V2', Number(latestBlock));

    return poolWithStateChanges;
};
