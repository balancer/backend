import { Chain } from '@prisma/client';
import { HookData } from '../../../prisma/prisma-types';
import { GqlHook, HookParams } from '../../../apps/api/gql/generated-schema';
import { V3JoinedSubgraphPool } from '../subgraphs';
import { zeroAddress } from 'viem';
import config from '../../../config';

const typeToParamsType = {
    AKRON: undefined,
    STABLE_SURGE: 'StableSurgeHookParams',
    FEE_TAKING: 'FeeTakingHookParams',
    EXIT_FEE: 'ExitFeeHookParams',
    MEV_TAX: 'MevTaxHookParams',
    DIRECTIONAL_FEE: undefined,
    LOTTERY: undefined,
    VEBAL_DISCOUNT: undefined,
    NFTLIQUIDITY_POSITION: undefined,
    RECLAMM: undefined,
    LBP: undefined,
    UNKNOWN: undefined,
};

export const hookTransformer = (poolData: V3JoinedSubgraphPool, chain: Chain): HookData | undefined => {
    // By default v3 pools have a hook config with the address 0x0
    // We don't want to store this in the database because it's not doing anything
    const hookConfig =
        poolData.hookConfig && poolData.hookConfig.hook.address !== zeroAddress ? poolData.hookConfig : undefined;

    if (!hookConfig) {
        return undefined;
    }

    const { hook, ...hookFlags } = hookConfig;
    const hookTypes = config[chain].hooks;

    let type = hookTypes?.[hook.address] || 'UNKNOWN';

    if (poolData.address === hook.address) {
        switch (poolData.factory.type) {
            case 'ReClamm':
                type = 'RECLAMM';
                break;
            case 'LBP':
                type = 'LBP';
                break;
            default:
                type = 'UNKNOWN';
        }
    }

    return {
        address: hook.address.toLowerCase(),
        type,
        ...hookFlags,
    };
};

export const mapHookToGqlHook = (hookData: HookData): GqlHook | undefined => {
    if (!hookData || !hookData.type) {
        return undefined;
    }

    const paramsTypename = typeToParamsType[hookData.type];

    return {
        address: hookData.address,
        name: hookData.name || '',
        type: hookData.type,
        config: {
            enableHookAdjustedAmounts: hookData.enableHookAdjustedAmounts,
            shouldCallAfterSwap: hookData.shouldCallAfterSwap,
            shouldCallBeforeSwap: hookData.shouldCallBeforeSwap,
            shouldCallAfterInitialize: hookData.shouldCallAfterInitialize,
            shouldCallBeforeInitialize: hookData.shouldCallBeforeInitialize,
            shouldCallAfterAddLiquidity: hookData.shouldCallAfterAddLiquidity,
            shouldCallBeforeAddLiquidity: hookData.shouldCallBeforeAddLiquidity,
            shouldCallAfterRemoveLiquidity: hookData.shouldCallAfterRemoveLiquidity,
            shouldCallBeforeRemoveLiquidity: hookData.shouldCallBeforeRemoveLiquidity,
            shouldCallComputeDynamicSwapFee: hookData.shouldCallComputeDynamicSwapFee,
        },
        reviewData: hookData.reviewData,
        params:
            (paramsTypename &&
                ({
                    __typename: paramsTypename,
                    ...hookData.dynamicData,
                } as HookParams)) ||
            undefined,
        // Deprecated
        enableHookAdjustedAmounts: hookData.enableHookAdjustedAmounts,
        shouldCallAfterSwap: hookData.shouldCallAfterSwap,
        shouldCallBeforeSwap: hookData.shouldCallBeforeSwap,
        shouldCallAfterInitialize: hookData.shouldCallAfterInitialize,
        shouldCallBeforeInitialize: hookData.shouldCallBeforeInitialize,
        shouldCallAfterAddLiquidity: hookData.shouldCallAfterAddLiquidity,
        shouldCallBeforeAddLiquidity: hookData.shouldCallBeforeAddLiquidity,
        shouldCallAfterRemoveLiquidity: hookData.shouldCallAfterRemoveLiquidity,
        shouldCallBeforeRemoveLiquidity: hookData.shouldCallBeforeRemoveLiquidity,
        shouldCallComputeDynamicSwapFee: hookData.shouldCallComputeDynamicSwapFee,
        dynamicData: hookData.dynamicData,
    };
};
