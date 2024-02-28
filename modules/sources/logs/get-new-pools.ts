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
            name: 'factory',
            type: 'address',
        },
        {
            components: [
                {
                    internalType: 'contract IERC20',
                    name: 'token',
                    type: 'address',
                },
                {
                    internalType: 'enum TokenType',
                    name: 'tokenType',
                    type: 'uint8',
                },
                {
                    internalType: 'contract IRateProvider',
                    name: 'rateProvider',
                    type: 'address',
                },
                {
                    internalType: 'bool',
                    name: 'yieldFeeExempt',
                    type: 'bool',
                },
            ],
            indexed: false,
            internalType: 'struct TokenConfig[]',
            name: 'tokenConfig',
            type: 'tuple[]',
        },
        {
            indexed: false,
            internalType: 'uint256',
            name: 'pauseWindowEndTime',
            type: 'uint256',
        },
        {
            indexed: false,
            internalType: 'address',
            name: 'pauseManager',
            type: 'address',
        },
        {
            components: [
                {
                    internalType: 'bool',
                    name: 'shouldCallBeforeInitialize',
                    type: 'bool',
                },
                {
                    internalType: 'bool',
                    name: 'shouldCallAfterInitialize',
                    type: 'bool',
                },
                {
                    internalType: 'bool',
                    name: 'shouldCallBeforeSwap',
                    type: 'bool',
                },
                {
                    internalType: 'bool',
                    name: 'shouldCallAfterSwap',
                    type: 'bool',
                },
                {
                    internalType: 'bool',
                    name: 'shouldCallBeforeAddLiquidity',
                    type: 'bool',
                },
                {
                    internalType: 'bool',
                    name: 'shouldCallAfterAddLiquidity',
                    type: 'bool',
                },
                {
                    internalType: 'bool',
                    name: 'shouldCallBeforeRemoveLiquidity',
                    type: 'bool',
                },
                {
                    internalType: 'bool',
                    name: 'shouldCallAfterRemoveLiquidity',
                    type: 'bool',
                },
            ],
            indexed: false,
            internalType: 'struct PoolCallbacks',
            name: 'callbacks',
            type: 'tuple',
        },
        {
            components: [
                {
                    internalType: 'bool',
                    name: 'supportsAddLiquidityCustom',
                    type: 'bool',
                },
                {
                    internalType: 'bool',
                    name: 'supportsRemoveLiquidityCustom',
                    type: 'bool',
                },
            ],
            indexed: false,
            internalType: 'struct LiquidityManagement',
            name: 'liquidityManagement',
            type: 'tuple',
        },
    ],
    name: 'PoolRegistered',
    type: 'event',
} as const;

/**
 * Extract balances from the contract
 */
export const getNewPools = async (vaultAddress: string, client: ViemClient, fromBlock: bigint) => {
    // Get Transfer logs from the vault
    const logs = await client.getLogs({
        address: vaultAddress as `0x${string}`,
        event,
        fromBlock,
    });

    // Parse the logs
    return logs;
};
