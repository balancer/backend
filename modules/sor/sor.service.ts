import {
    GqlCowSwapApiResponse,
    GqlSorSwapType,
    GqlSorGetSwapsResponse,
    QuerySorGetSwapsArgs,
    QuerySorGetCowSwapsArgs,
} from '../../schema';
import { sorV1BeetsService } from './sorV1Beets/sorV1Beets.service';
import { sorV2Service } from './sorV2/sorV2.service';
import { GetSwapsInput, SwapResult } from './types';
import { EMPTY_COWSWAP_RESPONSE } from './constants';
import { Chain } from '@prisma/client';
import { parseUnits, formatUnits } from '@ethersproject/units';
import { tokenService } from '../token/token.service';
import { getTokenAmountHuman, getTokenAmountRaw } from './utils';

export class SorService {
    async getCowSwaps(args: QuerySorGetCowSwapsArgs): Promise<GqlCowSwapApiResponse> {
        console.log('getCowSwaps args', JSON.stringify(args));
        const amountToken = args.swapType === 'EXACT_IN' ? args.tokenIn : args.tokenOut;
        // Use TokenAmount to help follow scaling requirements in later logic
        // args.swapAmount is RawScale, e.g. 1USDC should be passed as 1000000
        const amount = await getTokenAmountRaw(amountToken, args.swapAmount, args.chain!);

        const swap = await sorV2Service.getSwapResult({
            chain: args.chain!,
            swapAmount: amount,
            swapType: args.swapType,
            tokenIn: args.tokenIn.toLowerCase(),
            tokenOut: args.tokenOut.toLowerCase(),
            swapOptions: {},
        });
        const emptyResponse = EMPTY_COWSWAP_RESPONSE(args.tokenIn, args.tokenOut, amount);

        if (!swap) return emptyResponse;

        try {
            // Updates with latest onchain data before returning
            return await swap.getCowSwapResponse(true);
        } catch (err) {
            console.log(`Error Retrieving QuerySwap`, err);
            return emptyResponse;
        }
    }

    async getSorSwaps(args: QuerySorGetSwapsArgs): Promise<GqlSorGetSwapsResponse> {
        console.log('getSorSwaps args', JSON.stringify(args));
        const tokenIn = args.tokenIn.toLowerCase();
        const tokenOut = args.tokenOut.toLowerCase();
        const amountToken = args.swapType === 'EXACT_IN' ? tokenIn : tokenOut;
        // Use TokenAmount to help follow scaling requirements in later logic
        // args.swapAmount is HumanScale
        const amount = await getTokenAmountHuman(amountToken, args.swapAmount, args.chain!);

        const swap = await this.getComparingSwap({
            chain: args.chain!,
            swapAmount: amount,
            swapOptions: args.swapOptions,
            swapType: args.swapType,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
        });
        const emptyResponse = sorV1BeetsService.zeroResponse(args.swapType, args.tokenIn, args.tokenOut, amount);

        if (!swap) return emptyResponse;

        try {
            // Updates with latest onchain data before returning
            return swap.getSorSwapResponse(true);
        } catch (err) {
            console.log(`Error Retrieving QuerySwap`, err);
            return emptyResponse;
        }
    }

    private async getComparingSwap(input: GetSwapsInput) {
        const v1Start = +new Date();
        const swapV1 = await sorV1BeetsService.getSwapResult(input);
        const v1Time = +new Date() - v1Start;

        const v2Start = +new Date();
        const swapV2 = await sorV2Service.getSwapResult(input);
        const v2Time = +new Date() - v2Start;

        const version = this.getBestSwap(swapV1, swapV2, input.swapType);

        await this.logResult(
            version,
            swapV1,
            swapV2,
            input.swapType,
            input.tokenIn,
            input.tokenOut,
            input.chain,
            v1Time,
            v2Time,
        );

        if (!version) return null;

        return version === 'V1' ? swapV1 : swapV2;
    }

    /**
     * Find best swap result for V1 vs V2 and return in CowSwap API format. Log if V1 wins.
     * @param v1
     * @param v2
     * @param swapType
     * @returns
     */
    private getBestSwap(v1: SwapResult, v2: SwapResult, swapType: GqlSorSwapType, debugOut = false) {
        // Useful for comparing
        if (debugOut) {
            console.log(`------ DEBUG`);
            console.log(v1);
            console.log(v2);
        }

        if (!v1.isValid && !v2.isValid) return null;

        let isV1 = false;
        if (!v1.isValid || !v2.isValid) {
            isV1 = v1.isValid ? true : false;
        } else if (swapType === 'EXACT_IN') {
            if (v2.outputAmount < v1.outputAmount) {
                isV1 = true;
            }
        } else {
            if (v2.inputAmount > v1.inputAmount) {
                isV1 = true;
            }
        }

        if (isV1 === true) {
            return 'V1';
        }

        return 'V2';
    }

    private async logResult(
        version: string | null,
        v1: SwapResult,
        v2: SwapResult,
        swapType: GqlSorSwapType,
        assetIn: string,
        assetOut: string,
        chain: Chain,
        v1Time: number,
        v2Time: number,
    ) {
        if (!version) return;

        let v1ResultAmount = v1.inputAmount;
        let v2ResultAmount = v2.inputAmount < 0 ? -v2.inputAmount : v2.inputAmount;
        let tradeAmount = v1.outputAmount;
        let userToken = assetOut;
        let resultToken = assetIn;
        if (swapType === 'EXACT_IN') {
            v1ResultAmount = v1.outputAmount;
            v2ResultAmount = v2.outputAmount < 0 ? -v2.outputAmount : v2.outputAmount;
            tradeAmount = v1.inputAmount;
            userToken = assetIn;
            resultToken = assetOut;
        }

        const fp = (a: bigint, d: number) => Number(formatUnits(String(a), d));
        const bn = (a: string, d: number) => BigInt(String(parseUnits(a, d)));
        const prismaToken = await tokenService.getToken(resultToken, chain);
        const decimals = prismaToken!.decimals;
        let v2Perf =
            version === 'V1'
                ? 1 - fp(v1ResultAmount, decimals) / fp(v2ResultAmount, decimals) // negative perf means V1 is better
                : fp(v2ResultAmount, decimals) / fp(v1ResultAmount, decimals) - 1; // positive perf means V2 is better

        v2Perf = Math.max(-1, Math.min(1, v2Perf));
        let diffN = fp(v2ResultAmount, decimals) - fp(v1ResultAmount, decimals);
        let diff = bn(diffN.toFixed(decimals), decimals);
        let bestResultAmount = version === 'V1' ? v1ResultAmount : v2ResultAmount;

        console.log(
            [
                'SOR_RESULT',
                v1Time,
                v2Time,
                chain,
                version,
                swapType,
                userToken,
                resultToken,
                String(tradeAmount),
                String(bestResultAmount),
                String(diff),
                v2Perf.toFixed(8),
            ].join(','),
        );
    }
}

export const sorService = new SorService();
