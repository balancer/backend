// Sepolia 0xcc4a97bb41dc77013d625fc2a5e7867603d4c78b

import { parseAbi } from 'abitype';
import { formatEther } from 'viem';
import { ViemMulticallCall } from '../../../web3/multicaller-viem';

const abi = parseAbi([
    'function getSurgeThresholdPercentage(address pool) view returns (uint256)',
    'function getMaxSurgeFeePercentage(address pool) view returns (uint256)',
]);

export const stableSurgeHook = (address: string, poolAddress: string): ViemMulticallCall[] => [
    {
        path: `${poolAddress}.pool.hook.dynamicData.surgeThresholdPercentage`,
        address: address as `0x${string}`,
        abi,
        functionName: 'getSurgeThresholdPercentage',
        args: [poolAddress],
        parser: (result: bigint) => formatEther(result),
    },
    {
        path: `${poolAddress}.pool.hook.dynamicData.maxSurgeFeePercentage`,
        address: address as `0x${string}`,
        abi,
        functionName: 'getMaxSurgeFeePercentage',
        args: [poolAddress],
        parser: (result: bigint) => formatEther(result),
    },
];
