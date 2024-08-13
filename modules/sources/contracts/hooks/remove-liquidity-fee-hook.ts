import { ViemMulticallCall } from '../../../web3/multicaller-viem';
import removeLiquidityFeeHookAbi from '../abis/remove-liquidity-fee-hook';

export const removeLiquidityFeeHook = (address: string): ViemMulticallCall[] => [
    {
        path: `${address}.removeLiquidityFeePercentage`,
        address: address as `0x${string}`,
        abi: removeLiquidityFeeHookAbi,
        functionName: 'removeLiquidityHookFeePercentage',
    },
];
