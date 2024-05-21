import {
    GqlSorGetSwapPaths,
    GqlSorGetSwapsResponse,
    GqlSorSwapType,
    QuerySorGetSwapPathsArgs,
    QuerySorGetSwapsArgs,
} from '../../schema';
import { sorV1BeetsService } from './sorV1Beets/sorV1Beets.service';
import { sorV2Service } from './sorV2/sorPathService';
import { GetSwapsInput, GetSwapsV2Input as GetSwapPathsInput, SwapResult } from './types';
import * as Sentry from '@sentry/node';
import { Chain } from '@prisma/client';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { tokenService } from '../token/token.service';
import { getToken, getTokenAmountHuman, swapPathsZeroResponse, zeroResponse } from './utils';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';

export class SorService {
    async getSorSwapPaths(args: QuerySorGetSwapPathsArgs): Promise<GqlSorGetSwapPaths> {
        console.log('getSorSwaps args', JSON.stringify(args));
        const tokenIn = args.tokenIn.toLowerCase();
        const tokenOut = args.tokenOut.toLowerCase();
        const amountToken = args.swapType === 'EXACT_IN' ? tokenIn : tokenOut;
        const emptyResponse = swapPathsZeroResponse(args.tokenIn, args.tokenOut);

        let wethIsEth = false;
        if (
            tokenIn === AllNetworkConfigsKeyedOnChain[args.chain].data.eth.address ||
            tokenOut === AllNetworkConfigsKeyedOnChain[args.chain].data.eth.address
        ) {
            wethIsEth = true;
        }

        // check if tokens addresses exist
        try {
            await getToken(tokenIn, args.chain!);
            await getToken(tokenOut, args.chain!);
        } catch (e: any) {
            Sentry.captureException(e.message, {
                tags: {
                    service: 'sorV2',
                    tokenIn,
                    tokenOut,
                    swapAmount: args.swapAmount,
                    swapType: args.swapType,
                    chain: args.chain,
                },
            });
            return emptyResponse;
        }

        // we return an empty response if tokenIn and tokenOut are the same
        // also if tokenIn and tokenOut is weth/eth
        if (
            tokenIn === tokenOut ||
            (wethIsEth &&
                (tokenIn === AllNetworkConfigsKeyedOnChain[args.chain].data.weth.address ||
                    tokenOut === AllNetworkConfigsKeyedOnChain[args.chain].data.weth.address))
        ) {
            return emptyResponse;
        }

        // Use TokenAmount to help follow scaling requirements in later logic
        // args.swapAmount is HumanScale
        const amount = await getTokenAmountHuman(amountToken, args.swapAmount, args.chain!);
        if (!args.useVaultVersion) {
            return this.getBestSwapPathVersion({
                chain: args.chain!,
                swapAmount: amount,
                swapType: args.swapType,
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                queryBatchSwap: args.queryBatchSwap ? args.queryBatchSwap : false,
                callDataInput: args.callDataInput
                    ? {
                          receiver: args.callDataInput.receiver,
                          sender: args.callDataInput.sender,
                          slippagePercentage: args.callDataInput.slippagePercentage,
                          deadline: args.callDataInput.deadline,
                          wethIsEth: wethIsEth,
                      }
                    : undefined,
            });
        }
        return sorV2Service.getSorSwapPaths({
            chain: args.chain!,
            swapAmount: amount,
            swapType: args.swapType,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            vaultVersion: args.useVaultVersion,
            queryBatchSwap: args.queryBatchSwap ? args.queryBatchSwap : false,
            callDataInput: args.callDataInput
                ? {
                      receiver: args.callDataInput.receiver,
                      sender: args.callDataInput.sender,
                      slippagePercentage: args.callDataInput.slippagePercentage,
                      deadline: args.callDataInput.deadline,
                      wethIsEth: wethIsEth,
                  }
                : undefined,
        });
    }

    async getSorSwaps(args: QuerySorGetSwapsArgs): Promise<GqlSorGetSwapsResponse> {
        console.log('getSorSwaps args', JSON.stringify(args));
        const tokenIn = args.tokenIn.toLowerCase();
        const tokenOut = args.tokenOut.toLowerCase();
        const amountToken = args.swapType === 'EXACT_IN' ? tokenIn : tokenOut;
        const emptyResponse = zeroResponse(args.swapType, args.tokenIn, args.tokenOut, args.swapAmount);

        // check if tokens addresses exist
        try {
            await getToken(tokenIn, args.chain!);
            await getToken(tokenOut, args.chain!);
        } catch (e) {
            console.log(e);
            return emptyResponse;
        }

        // Use TokenAmount to help follow scaling requirements in later logic
        // args.swapAmount is HumanScale
        const amount = await getTokenAmountHuman(amountToken, args.swapAmount, args.chain!);

        const swapResult = await this.getComparingSwap({
            chain: args.chain!,
            swapAmount: amount,
            swapOptions: args.swapOptions,
            swapType: args.swapType,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
        });

        if (!swapResult) return emptyResponse;

        try {
            // Updates with latest onchain data before returning
            return swapResult.getSorSwapResponse(
                args.swapOptions.queryBatchSwap ? args.swapOptions.queryBatchSwap : false,
            );
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
        const decimals = prismaToken ? prismaToken.decimals : 18; // most probably native asset
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

    private async getBestSwapPathVersion(input: Omit<GetSwapPathsInput, 'vaultVersion'>) {
        const swapBalancerV2 = await sorV2Service.getSorSwapPaths({ ...input, vaultVersion: 2 });
        const swapBalancerV3 = await sorV2Service.getSorSwapPaths({ ...input, vaultVersion: 3 });
        if (input.swapType === 'EXACT_IN') {
            return parseFloat(swapBalancerV2.returnAmount) > parseFloat(swapBalancerV3.returnAmount)
                ? swapBalancerV2
                : swapBalancerV3;
        } else {
            return parseFloat(swapBalancerV2.returnAmount) < parseFloat(swapBalancerV3.returnAmount)
                ? swapBalancerV2
                : swapBalancerV3;
        }
    }
}

export const sorService = new SorService();
