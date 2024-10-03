import { Factory } from 'fishery';
import { HookData } from '../../schema'; 

export class HookDataFactory extends Factory<HookData> {}

export const hookDataFactory = HookDataFactory.define(({ params }) => {
    return {
        addLiquidityFeePercentage: params?.addLiquidityFeePercentage ?? '0.01',
        removeLiquidityFeePercentage: params?.removeLiquidityFeePercentage ?? '0.01',
        swapFeePercentage: params?.swapFeePercentage ?? '0.01',
    };
});
