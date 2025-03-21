import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import { formatEther } from 'viem';
import exitFeeHookAbi from '../abis/exit-fee-hook';

export const exitFeeHook = (address: string, poolAddress: string): ViemMulticallCall[] => [
    {
        path: `${poolAddress}.pool.hook.dynamicData.removeLiquidityFeePercentage`,
        address: address as `0x${string}`,
        abi: exitFeeHookAbi,
        functionName: 'exitFeePercentage',
        parser: (result: bigint) => formatEther(result),
    },
];
