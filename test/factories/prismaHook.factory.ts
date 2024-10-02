import { Factory } from 'fishery';
import { PrismaHookWithDynamic } from '../../prisma/prisma-types';
import { createRandomAddress } from '../utils';
import { Chain } from '@prisma/client';

class PrismaHookFactory extends Factory<PrismaHookWithDynamic> {
    
}

export const hookFactory = PrismaHookFactory.define(({ params }) => {
    const hookAddress = params?.address ?? createRandomAddress();

    return {
        id: Math.floor(Math.random() * (100)) + 1,
        name: params.name || 'Test Hook',
        address: hookAddress,
        chain: params?.chain || Chain.SEPOLIA,
        dynamicData: params?.dynamicData ?? {},
        enableHookAdjustedAmounts: params?.enableHookAdjustedAmounts ?? false,
        shouldCallAfterAddLiquidity: params?.shouldCallAfterAddLiquidity ?? false,
        shouldCallAfterInitialize: params?.shouldCallAfterInitialize ?? false,
        shouldCallAfterRemoveLiquidity: params?.shouldCallAfterRemoveLiquidity ?? false,
        shouldCallAfterSwap: params?.shouldCallAfterSwap ?? false,
        shouldCallBeforeAddLiquidity: params?.shouldCallBeforeAddLiquidity ?? false,
        shouldCallBeforeInitialize: params?.shouldCallBeforeInitialize ?? false,
        shouldCallBeforeRemoveLiquidity: params?.shouldCallBeforeRemoveLiquidity ?? false,
        shouldCallBeforeSwap: params?.shouldCallBeforeSwap ?? false,
        shouldCallComputeDynamicSwapFee: params?.shouldCallComputeDynamicSwapFee ?? false,
        pools: params?.pools ?? [],
    };
});
