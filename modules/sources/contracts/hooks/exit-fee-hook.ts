import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import exitFeeHookAbi from '../abis/exit-fee-hook';

export const exitFeeHook = (address: string): ViemMulticallCall[] => [
    {
        path: `${address}.removeLiquidityFeePercentage`,
        address: address as `0x${string}`,
        abi: exitFeeHookAbi,
        functionName: 'exitFeePercentage',
    },
];
