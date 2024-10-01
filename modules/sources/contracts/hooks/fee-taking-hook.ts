// Sepolia 0xcc4a97bb41dc77013d625fc2a5e7867603d4c78b

import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import feeTakingHookAbi from '../abis/fee-taking-hook';

export const feeTakingHook = (address: string): ViemMulticallCall[] => [
    {
        path: `${address}.swapFeePercentage`,
        address: address as `0x${string}`,
        abi: feeTakingHookAbi,
        functionName: 'hookSwapFeePercentage',
    },
    {
        path: `${address}.addLiquidityFeePercentage`,
        address: address as `0x${string}`,
        abi: feeTakingHookAbi,
        functionName: 'addLiquidityHookFeePercentage',
    },
    {
        path: `${address}.removeLiquidityFeePercentage`,
        address: address as `0x${string}`,
        abi: feeTakingHookAbi,
        functionName: 'removeLiquidityHookFeePercentage',
    },
];
