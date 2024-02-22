import { ViemClient } from '../types';

const event = {
    anonymous: false,
    inputs: [
        {
            indexed: true,
            internalType: 'address',
            name: 'token',
            type: 'address',
        },
        {
            indexed: true,
            internalType: 'address',
            name: 'from',
            type: 'address',
        },
        {
            indexed: true,
            internalType: 'address',
            name: 'to',
            type: 'address',
        },
        {
            indexed: false,
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
        },
    ],
    name: 'Transfer',
    type: 'event',
} as const;

/**
 * Extract balances from the contract
 */
export const getTransfers = async (vaultAddress: string, client: ViemClient, fromBlock: bigint) => {
    // Get Transfer logs from the vault
    const logs = await client.getLogs({
        address: vaultAddress as `0x${string}`,
        event,
        fromBlock,
    });

    // Parse the logs
    return logs;
};
