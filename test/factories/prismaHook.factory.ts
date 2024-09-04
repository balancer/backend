import { Factory } from 'fishery';
import { createRandomAddress } from '../utils';
import { Chain } from '@prisma/client';
import { Hook } from '../../schema'; // Adjust the path based on your project structure
import { hookDataFactory } from './prismaHookDynamicData.factory';

class PrismaHookFactory extends Factory<Hook> {
    
}

export const hookFactory = PrismaHookFactory.define(({ params }) => {
    const hookAddress = params?.address ?? createRandomAddress();

    return {
        address: hookAddress,
        chain: params?.chain || Chain.SEPOLIA,
        dynamicData: params?.dynamicData ?? hookDataFactory.build(),
        enableHookAdjustedAmounts: params?.enableHookAdjustedAmounts ?? false,
        poolsIds: params?.poolsIds ?? [],
        shouldCallAfterAddLiquidity: params?.shouldCallAfterAddLiquidity ?? false,
        shouldCallAfterInitialize: params?.shouldCallAfterInitialize ?? false,
        shouldCallAfterRemoveLiquidity: params?.shouldCallAfterRemoveLiquidity ?? false,
        shouldCallAfterSwap: params?.shouldCallAfterSwap ?? false,
        shouldCallBeforeAddLiquidity: params?.shouldCallBeforeAddLiquidity ?? false,
        shouldCallBeforeInitialize: params?.shouldCallBeforeInitialize ?? false,
        shouldCallBeforeRemoveLiquidity: params?.shouldCallBeforeRemoveLiquidity ?? false,
        shouldCallBeforeSwap: params?.shouldCallBeforeSwap ?? false,
        shouldCallComputeDynamicSwapFee: params?.shouldCallComputeDynamicSwapFee ?? false,
    };
});
