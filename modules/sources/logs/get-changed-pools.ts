import { ViemClient } from '../types';

const events = [
    {
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
    },
    {
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
    },
] as const;

/**
 * Extracts pool IDs from PoolBalanceChanged and Swap events changing the pool state
 *
 * @param vaultAddress - the address of the vault
 * @param client - the viem client to use
 * @param fromBlock - the block to start from
 * @param toBlock - the block to end at. When passing toBlock clients usually complain about too wide block range, without a limit it throws only when max logs are reached
 */
export const getChangedPools = async (
    vaultAddress: string,
    client: ViemClient,
    fromBlock: bigint,
    toBlock?: bigint, //
) => {
    // Get Transfer logs from the vault
    const logs = await client.getLogs({
        address: vaultAddress as `0x${string}`,
        events,
        fromBlock,
        toBlock,
    });

    // Get pools and make them unique
    const changedPools = logs
        .map((log) => log.args.pool!)
        .filter((value, index, self) => self.indexOf(value) === index);
    const latestBlock = logs.reduce((max, log) => (log.blockNumber > max ? log.blockNumber : max), 0n);
    return { changedPools, latestBlock };
};
