import { GqlCowSwapApiResponse, GqlSorSwapType, GqlSorGetSwapsResponse, GqlSorSwapOptionsInput } from '../../schema';
import { sorV1BalancerService } from './sorV1Balancer/sorV1Balancer.service';
import { sorV1BeetsService } from './sorV1Beets/sorV1Beets.service';
import { sorV2Service } from './sorV2/sorV2.service';
import { GetSwapsInput, SwapResult, SwapService } from './types';
import { EMPTY_COWSWAP_RESPONSE } from './constants';
import { publishMetric } from '../metrics/sor.metric';
import { Chain } from '@prisma/client';
import { parseUnits, formatUnits } from '@ethersproject/units';
import { tokenService } from '../token/token.service';

export class SorService {
    async getCowSwaps(input: GetSwapsInput): Promise<GqlCowSwapApiResponse> {
        const swap = await this.getSwap({ ...input, swapOptions: {} });
        const emptyResponse = EMPTY_COWSWAP_RESPONSE(input.tokenIn, input.tokenOut, input.swapAmount);

        if (!swap) return emptyResponse;

        try {
            // Updates with latest onchain data before returning
            return await swap.getCowSwapResponse(input.chain, true);
        } catch (err) {
            console.log(`Error Retrieving QuerySwap`, err);
            return emptyResponse;
        }
    }

    async getBeetsSwaps(input: GetSwapsInput): Promise<GqlSorGetSwapsResponse> {
        const swap = await this.getSwap(input, sorV1BeetsService);
        const emptyResponse = sorV1BeetsService.zeroResponse(
            input.swapType,
            input.tokenIn,
            input.tokenOut,
            input.swapAmount,
        );

        if (!swap) return emptyResponse;

        try {
            // Updates with latest onchain data before returning
            return swap.getBeetsSwapResponse(true);
        } catch (err) {
            console.log(`Error Retrieving QuerySwap`, err);
            return emptyResponse;
        }
    }

    private async getSwap(input: GetSwapsInput, v1Service: SwapService = sorV1BalancerService) {
        const v1Start = +new Date();
        const swapV1 = await v1Service.getSwapResult(input);
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
        // await publishMetric(chain, `SOR_VALID_V1`, v1.isValid ? 1 : 0);
        // await publishMetric(chain, `SOR_VALID_V2`, v2.isValid ? 1 : 0);

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

        // await publishMetric(chain, `SOR_TIME_V1`, v1Time);
        // await publishMetric(chain, `SOR_TIME_V2`, v2Time);
        // await publishMetric(chain, `SOR_V2_PERFORMACE`, v2Perf);

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
