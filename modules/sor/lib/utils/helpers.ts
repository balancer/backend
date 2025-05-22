import { BigintIsh, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { PathWithAmount } from '../path';

import { HookState } from '@balancer-labs/balancer-maths';
import { LiquidityManagement } from '../../types';

import { parseEther, parseUnits } from 'viem';
import { PrismaPoolAndHookWithDynamic, HookData } from '../../../../prisma/prisma-types';

export function checkInputs(
    tokenIn: Token,
    tokenOut: Token,
    swapKind: SwapKind,
    swapAmount: BigintIsh | TokenAmount,
): TokenAmount {
    let amount: TokenAmount;

    if (swapAmount instanceof TokenAmount) {
        amount = swapAmount;
    } else {
        amount = TokenAmount.fromRawAmount(swapKind === SwapKind.GivenIn ? tokenIn : tokenOut, swapAmount);
    }

    if (
        (swapKind === SwapKind.GivenIn && !tokenIn.isEqual(amount.token)) ||
        (swapKind === SwapKind.GivenOut && !tokenOut.isEqual(amount.token))
    ) {
        throw new Error('Swap amount token does not match input token');
    }

    return amount;
}

export function getInputAmount(paths: PathWithAmount[]): TokenAmount {
    if (!paths.every((p) => p.inputAmount.token.isEqual(paths[0].inputAmount.token))) {
        throw new Error('Input amount can only be calculated if all paths have the same input token');
    }
    const amounts = paths.map((path) => path.inputAmount);
    return amounts.reduce((a, b) => a.add(b));
}

export function getOutputAmount(paths: PathWithAmount[]): TokenAmount {
    if (!paths.every((p) => p.outputAmount.token.isEqual(paths[0].outputAmount.token))) {
        throw new Error('Output amount can only be calculated if all paths have the same output token');
    }
    const amounts = paths.map((path) => path.outputAmount);
    return amounts.reduce((a, b) => a.add(b));
}

export function getHookState(pool: PrismaPoolAndHookWithDynamic): HookState | undefined {
    if (!pool.hook) {
        return undefined;
    }

    const hookData = pool.hook as HookData;

    switch (hookData.type) {
        case 'MEV_TAX':
        case 'RECLAMM':
            return undefined;
        case 'AKRON': {
            return {
                weights: pool.tokens.map((token) => parseEther(token.weight as string)),
                minimumSwapFeePercentage: parseEther(pool.dynamicData?.swapFee || '0'),
                hookType: 'Akron',
            };
        }
        case 'EXIT_FEE': {
            // api for this hook is an Object with removeLiquidityFeePercentage key & fee as string
            const dynamicData = hookData.dynamicData as { removeLiquidityFeePercentage: string };

            return {
                tokens: pool.tokens.map((token: { address: string }) => token.address),
                // ExitFeeHook will always have dynamicData as part of the API response
                removeLiquidityHookFeePercentage: parseEther(dynamicData.removeLiquidityFeePercentage),
                hookType: 'ExitFee',
            };
        }
        case 'DIRECTIONAL_FEE': {
            // this hook does not require a hook state to be passed
            return {
                hookType: 'DirectionalFee',
            } as HookState;
        }
        case 'STABLE_SURGE': {
            const typeData = pool.typeData as { amp: string };
            const dynamicData = hookData.dynamicData as {
                surgeThresholdPercentage: string;
                maxSurgeFeePercentage: string;
            };
            return {
                // amp onchain precision is 1000. Api returns 200 means onchain value is 200000
                amp: parseUnits(typeData.amp, 3),
                // 18 decimal precision.
                surgeThresholdPercentage: parseEther(dynamicData.surgeThresholdPercentage),
                maxSurgeFeePercentage: parseEther(dynamicData.maxSurgeFeePercentage),
                hookType: 'StableSurge',
            };
        }
        default:
            if (hookData.type) {
                console.warn(`pool ${pool.id} with hook type ${hookData.type} not implemented`);
            }

            return undefined;
    }
}

export function isLiquidityManagement(value: any): value is LiquidityManagement {
    return (
        value &&
        typeof value.disableUnbalancedLiquidity === 'boolean' &&
        typeof value.enableAddLiquidityCustom === 'boolean' &&
        typeof value.enableDonation === 'boolean' &&
        typeof value.enableRemoveLiquidityCustom === 'boolean'
    );
}
