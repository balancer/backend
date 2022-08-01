import { GqlSorGetSwapsResponse, GqlSorSwapOptionsInput, GqlSorSwapType } from '../../schema';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { PrismaToken } from '@prisma/client';
import { poolService } from '../pool/pool.service';
import { oldBnum } from '../big-number/old-big-number';
import axios from 'axios';
import { SwapInfo } from '@balancer-labs/sdk';
import { networkConfig } from '../config/network-config';

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

        const { data } = await axios.post<{ swapInfo: SwapInfo }>(networkConfig.sor.url, {
            swapType,
            tokenIn,
            tokenOut,
            swapAmountScaled,
            swapOptions: {
                maxPools: swapOptions.maxPools || 8,
                forceRefresh: swapOptions.forceRefresh || false,
            },
        });
        const swapInfo = data.swapInfo;

        /*const swapInfo = await balancerSdk.sor.getSwaps(
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
        );*/

        const returnAmount = formatFixed(
            swapInfo.returnAmount,
            this.getTokenDecimals(swapType === 'EXACT_IN' ? tokenOut : tokenIn, tokens),
        );

        const pools = await poolService.getGqlPools({
            where: { idIn: swapInfo.routes.map((route) => route.hops.map((hop) => hop.poolId)).flat() },
        });

        const tokenInAmount = swapType === 'EXACT_IN' ? swapAmount : returnAmount;
        const tokenOutAmount = swapType === 'EXACT_IN' ? returnAmount : swapAmount;

        const effectivePrice = oldBnum(tokenInAmount).div(tokenOutAmount);
        const effectivePriceReversed = oldBnum(tokenOutAmount).div(tokenInAmount);
        const priceImpact = effectivePrice.div(swapInfo.marketSp).minus(1);

        return {
            ...swapInfo,
            swapType,
            tokenInAmount,
            tokenOutAmount,
            swapAmount,
            swapAmountScaled: swapInfo.swapAmount.toString(),
            swapAmountForSwaps: swapInfo.swapAmountForSwaps?.toString(),
            returnAmount,
            returnAmountScaled: swapInfo.returnAmount.toString(),
            returnAmountConsideringFees: swapInfo.returnAmountConsideringFees.toString(),
            returnAmountFromSwaps: swapInfo.returnAmountFromSwaps?.toString(),
            routes: swapInfo.routes.map((route) => ({
                ...route,
                hops: route.hops.map((hop) => ({
                    ...hop,
                    pool: pools.find((pool) => pool.id === hop.poolId)!,
                })),
            })),
            effectivePrice: effectivePrice.toString(),
            effectivePriceReversed: effectivePriceReversed.toString(),
            priceImpact: priceImpact.toString(),
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
