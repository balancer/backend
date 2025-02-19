import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import abi from '../abis/mev-tax-hook';

export const mevTaxHook = (address: string, poolAddress: string): ViemMulticallCall[] => [
    {
        path: `getMaxMevSwapFeePercentage`,
        address: address as `0x${string}`,
        abi,
        functionName: 'getMaxMevSwapFeePercentage',
    },
    {
        path: `getPoolMevTaxMultiplier`,
        address: address as `0x${string}`,
        abi,
        functionName: 'getPoolMevTaxMultiplier',
        args: [poolAddress],
    },
    {
        path: `getPoolMevTaxThreshold`,
        address: address as `0x${string}`,
        abi,
        functionName: 'getPoolMevTaxThreshold',
        args: [poolAddress],
    },
];
