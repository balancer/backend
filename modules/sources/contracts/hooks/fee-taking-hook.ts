// Sepolia 0xcc4a97bb41dc77013d625fc2a5e7867603d4c78b

import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { formatEther } from 'viem';
import feeTakingHookAbi from '../abis/fee-taking-hook';

export const feeTakingHook = (address: string, poolAddress: string): ViemMulticallCall[] => [
    {
        path: `${poolAddress}.pool.hook.dynamicData.swapFeePercentage`,
        address: address as `0x${string}`,
        abi: feeTakingHookAbi,
        functionName: 'hookSwapFeePercentage',
        parser: (result: bigint) => formatEther(result),
    },
    {
        path: `${poolAddress}.pool.hook.dynamicData.addLiquidityFeePercentage`,
        address: address as `0x${string}`,
        abi: feeTakingHookAbi,
        functionName: 'addLiquidityHookFeePercentage',
        parser: (result: bigint) => formatEther(result),
    },
    {
        path: `${poolAddress}.pool.hook.dynamicData.removeLiquidityFeePercentage`,
        address: address as `0x${string}`,
        abi: feeTakingHookAbi,
        functionName: 'removeLiquidityHookFeePercentage',
        parser: (result: bigint) => formatEther(result),
    },
];
