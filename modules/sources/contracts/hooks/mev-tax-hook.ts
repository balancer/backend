import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { formatEther } from 'viem';
import abi from '../abis/mev-tax-hook';

export const mevTaxHook = (address: string, poolAddress: string): ViemMulticallCall[] => [
    {
        path: `${poolAddress}.pool.hook.dynamicData.maxMevSwapFeePercentage`,
        address: address as `0x${string}`,
        abi,
        functionName: 'getMaxMevSwapFeePercentage',
        parser: (result: bigint) => formatEther(result),
    },
    {
        path: `${poolAddress}.pool.hook.dynamicData.mevTaxMultiplier`,
        address: address as `0x${string}`,
        abi,
        functionName: 'getPoolMevTaxMultiplier',
        args: [poolAddress],
        parser: (result: bigint) => formatEther(result),
    },
    {
        path: `${poolAddress}.pool.hook.dynamicData.mevTaxThreshold`,
        address: address as `0x${string}`,
        abi,
        functionName: 'getPoolMevTaxThreshold',
        args: [poolAddress],
        parser: (result: bigint) => formatEther(result),
    },
];
