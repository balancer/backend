import { balancerSdk } from './src/balancer-sdk';
import { SwapTypes } from '@balancer-labs/sor';
import { GqlBalancerPool, GqlSorGetSwapsInput, GqlSorGetSwapsResponse } from '../../schema';
import _ from 'lodash';
import { parseFixed } from '@ethersproject/bignumber';

export class BalancerSorService {
    public async getSwaps({
        tokenIn,
        tokenOut,
        swapType,
        swapOptions,
        swapAmount,
        boostedPools,
        pools,
    }: GqlSorGetSwapsInput & { boostedPools: string[]; pools: GqlBalancerPool[] }): Promise<GqlSorGetSwapsResponse> {
        const tokenDecimals = this.getTokenDecimals(swapType === 'EXACT_IN' ? tokenIn : tokenOut, pools);
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
            returnAmount: swapInfo.returnAmount.toString(),
            returnAmountConsideringFees: swapInfo.returnAmountConsideringFees.toString(),
            returnAmountFromSwaps: swapInfo.returnAmountFromSwaps?.toString(),
            swapAmount: swapInfo.swapAmount.toString(),
            swapAmountForSwaps: swapInfo.swapAmountForSwaps?.toString(),
        };
    }

    private getTokenDecimals(tokenAddress: string, pools: GqlBalancerPool[]): number {
        if (tokenAddress === '0x0000000000000000000000000000000000000000') {
            return 18;
        }

        tokenAddress = tokenAddress.toLowerCase();
        const allTokens = _.flatten(pools.map((pool) => pool.tokens || []));
        const match = allTokens.find((token) => token.address === tokenAddress);

        if (!match) {
            throw new Error('Unknown token: ' + tokenAddress);
        }

        return match.decimals;
    }
}

export const balancerSorService = new BalancerSorService();
