import { GqlSorSwapType, GqlSorGetSwapsResponse, GqlSorSwap } from '../../../schema';
import { Chain } from '@prisma/client';
import { SwapResult } from '../types';
import { poolService } from '../../pool/pool.service';
import { BigNumber } from 'ethers';
import { oldBnum } from '../../big-number/old-big-number';
import { mapRoutes } from './beetsHelpers';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';
import { Swap } from './lib/entities/swap';
import { Address } from 'viem';
import { BatchSwapStep, SingleSwap, SwapKind } from './lib/types';
import { TokenAmount } from './lib/entities/tokenAmount';
import { formatFixed } from '@ethersproject/bignumber';
import { replaceZeroAddressWithEth } from '../../web3/addresses';

export class SwapResultV2 implements SwapResult {
    private swap: Swap | null;
    private chain: Chain;
    public inputAmount: bigint = BigInt(0);
    public outputAmount: bigint = BigInt(0);
    public isValid: boolean;

    constructor(swap: Swap | null, chain: Chain) {
        if (swap === null) {
            this.isValid = false;
            this.swap = null;
            this.chain = chain;
        } else {
            this.isValid = true;
            this.swap = swap;
            this.inputAmount = swap.inputAmount.amount;
            this.outputAmount = swap.outputAmount.amount;
            this.chain = chain;
        }
    }

    async getSorSwapResponse(queryFirst = false): Promise<GqlSorGetSwapsResponse> {
        if (!this.isValid || this.swap === null) throw new Error('No Response - Invalid Swap');

        if (!queryFirst) return this.mapResultToBeetsSwap(this.swap, this.swap.inputAmount, this.swap.outputAmount);
        else {
            const rpcUrl = AllNetworkConfigsKeyedOnChain[this.chain].data.rpcUrl;
            const balancerQueriesAddress =
                AllNetworkConfigsKeyedOnChain[this.chain].data.balancer.v2.balancerQueriesAddress;
            const updatedResult = await this.swap.query(rpcUrl, balancerQueriesAddress as Address);

            const inputAmount = this.swap.swapKind === SwapKind.GivenIn ? this.swap.inputAmount : updatedResult;
            const outputAmount = this.swap.swapKind === SwapKind.GivenIn ? updatedResult : this.swap.outputAmount;

            return this.mapResultToBeetsSwap(this.swap, inputAmount, outputAmount);
        }
    }

    private async mapResultToBeetsSwap(
        swap: Swap,
        inputAmount: TokenAmount,
        outputAmount: TokenAmount,
    ): Promise<GqlSorGetSwapsResponse> {
        const priceImpact = swap.priceImpact.decimal.toFixed(4);
        let poolIds: string[];
        if (swap.isBatchSwap) {
            const swaps = swap.swaps as BatchSwapStep[];
            poolIds = swaps.map((swap) => swap.poolId);
        } else {
            const singleSwap = swap.swaps as SingleSwap;
            poolIds = [singleSwap.poolId];
        }
        const pools = await poolService.getGqlPools({
            where: { idIn: poolIds },
        });

        const swapAmountForSwaps =
            swap.swapKind === SwapKind.GivenIn ? inputAmount.amount.toString() : outputAmount.amount.toString();
        const returnAmountFromSwaps =
            swap.swapKind === SwapKind.GivenIn ? outputAmount.amount.toString() : inputAmount.amount.toString();

        const tokenInAmountFixed = formatFixed(inputAmount.amount.toString(), inputAmount.token.decimals);
        const tokenOutAmountFixed = formatFixed(outputAmount.amount.toString(), outputAmount.token.decimals);

        const swapAmountQuery =
            swap.swapKind === SwapKind.GivenOut ? outputAmount.amount.toString() : inputAmount.amount.toString();
        const returnAmount =
            swap.swapKind === SwapKind.GivenIn ? outputAmount.amount.toString() : inputAmount.amount.toString();
        const swapAmountQueryFixed = swap.swapKind === SwapKind.GivenOut ? tokenOutAmountFixed : tokenInAmountFixed;
        const returnAmountFixed = swap.swapKind === SwapKind.GivenIn ? tokenOutAmountFixed : tokenInAmountFixed;

        const effectivePrice = oldBnum(tokenInAmountFixed).div(tokenOutAmountFixed);
        const effectivePriceReversed = oldBnum(tokenOutAmountFixed).div(tokenInAmountFixed);

        const routes = mapRoutes(
            swap.swaps,
            inputAmount.amount.toString(),
            outputAmount.amount.toString(),
            pools,
            swap.inputAmount.token.address,
            swap.outputAmount.token.address,
            swap.assets,
            swap.swapKind,
        );

        for (const route of routes) {
            route.tokenInAmount = oldBnum(tokenInAmountFixed)
                .multipliedBy(route.share)
                .dp(inputAmount.token.decimals)
                .toString();
            route.tokenOutAmount = oldBnum(tokenOutAmountFixed)
                .multipliedBy(route.share)
                .dp(outputAmount.token.decimals)
                .toString();
        }

        return {
            swaps: this.mapSwaps(swap.swaps, swap.assets),
            marketSp: '0', // Daniel confirmed returning 0 should be fine here
            tokenAddresses: swap.assets,
            tokenIn: replaceZeroAddressWithEth(inputAmount.token.address),
            tokenOut: replaceZeroAddressWithEth(outputAmount.token.address),
            swapType: this.mapSwapKind(swap.swapKind),
            tokenInAmount: tokenInAmountFixed,
            tokenOutAmount: tokenOutAmountFixed,
            swapAmount: swapAmountQueryFixed,
            swapAmountScaled: swapAmountQuery,
            swapAmountForSwaps: swapAmountForSwaps ? BigNumber.from(swapAmountForSwaps).toString() : undefined,
            returnAmount: returnAmountFixed,
            returnAmountScaled: returnAmount,
            returnAmountConsideringFees: BigNumber.from(returnAmountFromSwaps).toString(),
            returnAmountFromSwaps: returnAmountFromSwaps ? BigNumber.from(returnAmountFromSwaps).toString() : undefined,
            routes: routes.map((route) => ({
                ...route,
                hops: route.hops.map((hop) => ({
                    ...hop,
                    pool: pools.find((pool) => pool.id === hop.poolId)!,
                })),
            })),
            effectivePrice: effectivePrice.toString(),
            effectivePriceReversed: effectivePriceReversed.toString(),
            priceImpact: priceImpact,
        };
    }

    private mapSwaps(swaps: BatchSwapStep[] | SingleSwap, assets: string[]): GqlSorSwap[] {
        if (Array.isArray(swaps)) {
            return swaps.map((swap) => {
                return {
                    ...swap,
                    assetInIndex: Number(swap.assetInIndex.toString()),
                    assetOutIndex: Number(swap.assetOutIndex.toString()),
                    amount: swap.amount.toString(),
                };
            });
        } else {
            const assetInIndex = assets.indexOf(swaps.assetIn);
            const assetOutIndex = assets.indexOf(swaps.assetOut);
            return [
                {
                    ...swaps,
                    assetInIndex,
                    assetOutIndex,
                    amount: swaps.amount.toString(),
                    userData: swaps.userData,
                },
            ];
        }
    }

    private mapSwapKind(kind: SwapKind): GqlSorSwapType {
        return kind === SwapKind.GivenIn ? 'EXACT_IN' : 'EXACT_OUT';
    }

    // /**
    //  * Formats a sequence of swaps to a format that is useful for displaying the routes in user interfaces.
    //  * Taken directly from Beets SOR: https://github.com/beethovenxfi/balancer-sor/blob/beethovenx-master/src/formatSwaps.ts#L167
    //  * @dev The swaps are converted to an array of routes, where each route has an array of hops
    //  * @param swapType - exact in or exact out
    //  * @param routes - The original Swaps
    //  * @param swapAmount - The total amount being swapped
    //  * @returns SwapInfoRoute[] - The swaps formatted as routes with hops
    //  */
    // private formatRoutesSOR(swapType: SwapTypes, routes: Swap[][], swapAmount: BigNumber): SwapInfoRoute[] {
    //     const exactIn = swapType === SwapTypes.SwapExactIn;

    //     return routes.map((swaps) => {
    //         const first = swaps[0];
    //         const last = swaps[swaps.length - 1];
    //         const tokenInAmount = (exactIn ? first.swapAmount : last.swapAmountOut) || '0';
    //         const tokenOutAmount = (exactIn ? last.swapAmountOut : first.swapAmount) || '0';
    //         const tokenInAmountScaled = oldBnumScale(bnum(tokenInAmount), first.tokenInDecimals);

    //         return {
    //             tokenIn: first.tokenIn,
    //             tokenOut: last.tokenOut,
    //             tokenInAmount,
    //             tokenOutAmount,
    //             share: tokenInAmountScaled.div(bnum(swapAmount.toString())).toNumber(),
    //             hops: swaps.map((swap): SwapInfoRouteHop => {
    //                 return {
    //                     tokenIn: swap.tokenIn,
    //                     tokenOut: swap.tokenOut,
    //                     tokenInAmount: (exactIn ? swap.swapAmount : swap.swapAmountOut) || '0',
    //                     tokenOutAmount: (exactIn ? swap.swapAmountOut : swap.swapAmount) || '0',
    //                     poolId: swap.pool,
    //                 };
    //             }),
    //         };
    //     });
    // }
}
