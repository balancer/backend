import { ViemClient } from '../types';

const event = {
    anonymous: false,
    inputs: [
        {
            indexed: true,
            internalType: 'address',
            name: 'pool',
            type: 'address',
        },
        {
            indexed: true,
            internalType: 'address',
            name: 'liquidityProvider',
            type: 'address',
        },
        {
            indexed: false,
            internalType: 'contract IERC20[]',
            name: 'tokens',
            type: 'address[]',
        },
        {
            indexed: false,
            internalType: 'int256[]',
            name: 'deltas',
            type: 'int256[]',
        },
    ],
    name: 'PoolBalanceChanged',
    type: 'event',
} as const;

export const getPoolBalanceChanged = async (
    vaultAddress: string,
    client: ViemClient,
    fromBlock: bigint,
    toBlock: bigint | undefined = undefined,
) => {
    const logs = await client.getLogs({
        address: vaultAddress as `0x${string}`,
        event,
        fromBlock,
        toBlock,
    });

    return logs;
};
