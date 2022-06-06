import { balancerSdk } from './src/balancer-sdk';
import { SwapTypes } from '@balancer-labs/sor';
import { GqlSorGetSwapsResponse, GqlSorSwapOptionsInput, GqlSorSwapType } from '../../schema';
import _ from 'lodash';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { PrismaToken } from '@prisma/client';

interface GetSwapsInput {
    tokenIn: string;
    tokenOut: string;
    swapType: GqlSorSwapType;
    swapAmount: string;
    swapOptions: GqlSorSwapOptionsInput;
    boostedPools: string[];
    tokens: PrismaToken[];
}

export class BalancerSorService {
    public async getSwaps({
        tokenIn,
        tokenOut,
        swapType,
        swapOptions,
        swapAmount,
        boostedPools,
        tokens,
    }: GetSwapsInput): Promise<GqlSorGetSwapsResponse> {
        const tokenDecimals = this.getTokenDecimals(swapType === 'EXACT_IN' ? tokenIn : tokenOut, tokens);
        const swapAmountScaled = parseFixed(swapAmount, tokenDecimals);

        const swapInfo = await balancerSdk.sor.getSwaps(
            tokenIn,
            tokenOut,
            swapType === 'EXACT_IN' ? SwapTypes.SwapExactIn : SwapTypes.SwapExactOut,
            swapAmountScaled,
            {
                timestamp: swapOptions.timestamp || Math.floor(Date.now() / 1000),
                //TODO: move this to env
                maxPools: swapOptions.maxPools || 8,
                forceRefresh: swapOptions.forceRefresh || false,
                boostedPools,
                //TODO: support gas price and swap gas
            },
        );

        return {
            ...swapInfo,
            swapType,
            returnAmount: formatFixed(swapInfo.returnAmount, this.getTokenDecimals(tokenOut, tokens)),
            returnAmountScaled: swapInfo.returnAmount.toString(),
            returnAmountConsideringFees: swapInfo.returnAmountConsideringFees.toString(),
            returnAmountFromSwaps: swapInfo.returnAmountFromSwaps?.toString(),
            swapAmount: formatFixed(swapInfo.swapAmount, this.getTokenDecimals(tokenIn, tokens)),
            swapAmountScaled: swapInfo.swapAmount.toString(),
            swapAmountForSwaps: swapInfo.swapAmountForSwaps?.toString(),
        };
    }

    private getTokenDecimals(tokenAddress: string, tokens: PrismaToken[]): number {
        if (tokenAddress === '0x0000000000000000000000000000000000000000') {
            return 18;
        }

        tokenAddress = tokenAddress.toLowerCase();
        const match = tokens.find((token) => token.address === tokenAddress);

        if (!match) {
            throw new Error('Unknown token: ' + tokenAddress);
        }

        return match.decimals;
    }
}

export const balancerSorService = new BalancerSorService();
