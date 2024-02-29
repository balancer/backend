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
            internalType: 'contract IERC20',
            name: 'tokenIn',
            type: 'address',
        },
        {
            indexed: true,
            internalType: 'contract IERC20',
            name: 'tokenOut',
            type: 'address',
        },
        {
            indexed: false,
            internalType: 'uint256',
            name: 'amountIn',
            type: 'uint256',
        },
        {
            indexed: false,
            internalType: 'uint256',
            name: 'amountOut',
            type: 'uint256',
        },
        {
            indexed: false,
            internalType: 'uint256',
            name: 'swapFeeAmount',
            type: 'uint256',
        },
    ],
    name: 'Swap',
    type: 'event',
} as const;

/**
 * Extract balances from the contract
 */
export const getSwaps = async (
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
