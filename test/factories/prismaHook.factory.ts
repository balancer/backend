import { Factory } from 'fishery';
import { createRandomAddress } from '../utils';

import { HookData } from '../../prisma/prisma-types';

class PrismaHookFactory extends Factory<HookData> {}

export const hookFactory = PrismaHookFactory.define(({ params }) => {
    return {
        address: createRandomAddress(),
        name: 'Test Hook',
        type: 'UNKNOWN',
        enableHookAdjustedAmounts: false,
        shouldCallAfterSwap: false,
        shouldCallBeforeSwap: false,
        shouldCallAfterInitialize: false,
        shouldCallBeforeInitialize: false,
        shouldCallAfterAddLiquidity: false,
        shouldCallBeforeAddLiquidity: false,
        shouldCallAfterRemoveLiquidity: false,
        shouldCallBeforeRemoveLiquidity: false,
        shouldCallComputeDynamicSwapFee: false,
        dynamicData: {},
        reviewData: {
            summary: '',
            reviewFile: '',
            warnings: [],
        },
    } as HookData;
});
