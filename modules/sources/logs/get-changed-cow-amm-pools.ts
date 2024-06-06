import { ViemClient } from '../types';

const events = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'caller',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenIn',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenOut',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmountIn',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmountOut',
                type: 'uint256',
            },
        ],
        name: 'LOG_SWAP',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'caller',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenIn',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmountIn',
                type: 'uint256',
            },
        ],
        name: 'LOG_JOIN',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'caller',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenOut',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokenAmountOut',
                type: 'uint256',
            },
        ],
        name: 'LOG_EXIT',
        type: 'event',
    },
] as const;

/**
 * Extracts pool IDs from PoolBalanceChanged and Swap events changing the pool state
 *
 * @param poolAddresses - the list of pool address to check the events for
 * @param client - the viem client to use
 * @param fromBlock - the block to start from
 * @param toBlock - the block to end at. When passing toBlock clients usually complain about too wide block range, without a limit it throws only when max logs are reached
 */
export const getChangedCowAmmPools = async (
    poolAddresses: string[],
    client: ViemClient,
    fromBlock: bigint,
    toBlock?: bigint, //
) => {
    // Get Transfer logs from the vault
    const logs = await client.getLogs({
        address: poolAddresses as `0x${string}`[],
        events,
        fromBlock,
        toBlock,
    });

    // Get pools and make them unique
    const changedPools = logs
        .map((log) => log.address.toLowerCase())
        .filter((value, index, self) => self.indexOf(value) === index);
    const latestBlock = logs.reduce((max, log) => (log.blockNumber > max ? log.blockNumber : max), 0n);
    return { changedPools, latestBlock };
};
