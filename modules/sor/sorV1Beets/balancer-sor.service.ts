import { GqlSorGetSwapsResponse, GqlSorSwapOptionsInput, GqlSorSwapType, GqlPoolMinimal } from '../../../schema';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { Chain, PrismaToken } from '@prisma/client';
import { poolService } from '../../pool/pool.service';
import { oldBnum } from '../../big-number/old-big-number';
import axios from 'axios';
import { SwapInfo, SwapV2 } from '@balancer-labs/sdk';
import { replaceEthWithZeroAddress, replaceZeroAddressWithEth } from '../../web3/addresses';
import { BigNumber } from 'ethers';
import { env } from '../../../apps/env';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';
import { DeploymentEnv } from '../../network/network-config-types';
import _ from 'lodash';
import { SwapInfoRoute } from '@balancer-labs/sor';
import { ZERO_ADDRESS } from '@balancer/sdk';

interface GetSwapsInput {
    tokenIn: string;
    tokenOut: string;
    swapType: GqlSorSwapType;
    swapAmount: string;
    swapOptions: GqlSorSwapOptionsInput;
    tokens: PrismaToken[];
    chain: Chain;
}

export class BalancerSorService {
    public async getSwaps({
        tokenIn,
        tokenOut,
        swapType,
        swapOptions,
        swapAmount,
        tokens,
        chain,
    }: GetSwapsInput): Promise<GqlSorGetSwapsResponse> {
        tokenIn = replaceEthWithZeroAddress(tokenIn);
        tokenOut = replaceEthWithZeroAddress(tokenOut);

        tokenIn = tokenIn.toLowerCase();
        tokenOut = tokenOut.toLowerCase();

        const tokenDecimals = this.getTokenDecimals(swapType === 'EXACT_IN' ? tokenIn : tokenOut, tokens);

        let swapAmountScaled = BigNumber.from(`0`);
        try {
            swapAmountScaled = parseFixed(swapAmount, tokenDecimals);
        } catch (e) {
            console.log(`Invalid input: Could not parse swapAmount ${swapAmount} with decimals ${tokenDecimals}`);
            throw new Error('SOR: invalid swap amount input');
        }

        let swapInfo = await this.querySor(swapType, tokenIn, tokenOut, swapAmountScaled, swapOptions, chain);
        // no swaps found, return 0
        if (swapInfo.swaps.length === 0) {
            return this.zeroResponse(swapType, tokenIn, tokenOut, swapAmount);
        }

        const pools = await poolService.getGqlPools({
            where: { idIn: swapInfo.routes.map((route) => route.hops.map((hop) => hop.poolId)).flat() },
        });

        const tokenInAmount = swapType === 'EXACT_IN' ? swapAmountScaled : BigNumber.from(swapInfo.returnAmount);
        const tokenOutAmount = swapType === 'EXACT_IN' ? BigNumber.from(swapInfo.returnAmount) : swapAmountScaled;

        return this.formatResponse({
            tokenIn: swapInfo.tokenIn,
            tokenOut: swapInfo.tokenOut,
            tokens,
            tokenInAmtEvm: tokenInAmount.toString(),
            tokenOutAmtEvm: tokenOutAmount.toString(),
            swapAmountForSwaps: BigNumber.from(swapInfo.swapAmountForSwaps).toString(),
            returnAmountConsideringFees: BigNumber.from(swapInfo.returnAmountConsideringFees).toString(),
            returnAmountFromSwaps: BigNumber.from(swapInfo.returnAmountFromSwaps).toString(),
            routes: swapInfo.routes,
            pools,
            marketSp: swapInfo.marketSp,
            swaps: swapInfo.swaps,
            tokenAddresses: swapInfo.tokenAddresses,
            swapType,
        });
    }

    formatResponse(swapData: {
        tokenIn: string;
        tokenOut: string;
        swapType: GqlSorSwapType;
        tokens: PrismaToken[];
        tokenInAmtEvm: string;
        tokenOutAmtEvm: string;
        swapAmountForSwaps: string;
        returnAmountConsideringFees: string;
        returnAmountFromSwaps: string;
        routes: SwapInfoRoute[];
        pools: GqlPoolMinimal[];
        marketSp: string;
        swaps: SwapV2[];
        tokenAddresses: string[];
        priceImpact?: string;
    }): GqlSorGetSwapsResponse {
        const {
            tokenIn,
            tokenOut,
            swapType,
            tokens,
            tokenInAmtEvm,
            tokenOutAmtEvm,
            swapAmountForSwaps,
            returnAmountConsideringFees,
            returnAmountFromSwaps,
            routes,
            pools,
            marketSp,
            swaps,
            tokenAddresses,
            priceImpact: rawPriceImpact,
        } = swapData;

        const tokenInAmountFixed = formatFixed(tokenInAmtEvm, this.getTokenDecimals(tokenIn, tokens));
        const tokenOutAmountFixed = formatFixed(tokenOutAmtEvm, this.getTokenDecimals(tokenOut, tokens));

        const swapAmountQuery = swapType === 'EXACT_OUT' ? tokenOutAmtEvm : tokenInAmtEvm;
        const returnAmount = swapType === 'EXACT_IN' ? tokenOutAmtEvm : tokenInAmtEvm;
        const swapAmountQueryFixed = swapType === 'EXACT_OUT' ? tokenOutAmountFixed : tokenInAmountFixed;
        const returnAmountFixed = swapType === 'EXACT_IN' ? tokenOutAmountFixed : tokenInAmountFixed;

        const effectivePrice = oldBnum(tokenInAmountFixed).div(tokenOutAmountFixed);
        const effectivePriceReversed = oldBnum(tokenOutAmountFixed).div(tokenInAmountFixed);
        const priceImpact = effectivePrice.div(marketSp).minus(1);

        for (const route of routes) {
            route.tokenInAmount = oldBnum(tokenInAmountFixed)
                .multipliedBy(route.share)
                .dp(this.getTokenDecimals(tokenIn, tokens))
                .toString();
            route.tokenOutAmount = oldBnum(tokenOutAmountFixed)
                .multipliedBy(route.share)
                .dp(this.getTokenDecimals(tokenOut, tokens))
                .toString();
        }

        return {
            swaps,
            marketSp,
            tokenAddresses,
            tokenIn: replaceZeroAddressWithEth(tokenIn),
            tokenOut: replaceZeroAddressWithEth(tokenOut),
            swapType,
            tokenInAmount: tokenInAmountFixed,
            tokenOutAmount: tokenOutAmountFixed,
            swapAmount: swapAmountQueryFixed,
            swapAmountScaled: swapAmountQuery,
            swapAmountForSwaps: swapAmountForSwaps ? BigNumber.from(swapAmountForSwaps).toString() : undefined,
            returnAmount: returnAmountFixed,
            returnAmountScaled: returnAmount,
            returnAmountConsideringFees: BigNumber.from(returnAmountConsideringFees).toString(),
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
            priceImpact: rawPriceImpact ? rawPriceImpact : priceImpact.toString(),
        };
    }

    zeroResponse(
        swapType: GqlSorSwapType,
        tokenIn: string,
        tokenOut: string,
        swapAmount: string,
    ): GqlSorGetSwapsResponse {
        return {
            marketSp: '0',
            tokenAddresses: [],
            swaps: [],
            tokenIn: replaceZeroAddressWithEth(tokenIn),
            tokenOut: replaceZeroAddressWithEth(tokenOut),
            swapType,
            tokenInAmount: swapType === 'EXACT_IN' ? swapAmount : '0',
            tokenOutAmount: swapType === 'EXACT_IN' ? '0' : swapAmount,
            swapAmount: swapType === 'EXACT_IN' ? '0' : swapAmount,
            swapAmountScaled: '0',
            swapAmountForSwaps: '0',
            returnAmount: '0',
            returnAmountScaled: '0',
            returnAmountConsideringFees: '0',
            returnAmountFromSwaps: '0',
            routes: [],
            effectivePrice: '0',
            effectivePriceReversed: '0',
            priceImpact: '0',
        };
    }

    private async querySor(
        swapType: string,
        tokenIn: string,
        tokenOut: string,
        swapAmountScaled: BigNumber,
        swapOptions: GqlSorSwapOptionsInput,
        chain: Chain,
    ) {
        const sorConfig = AllNetworkConfigsKeyedOnChain[chain].data.sor;
        const config = sorConfig?.env && sorConfig.env[env.DEPLOYMENT_ENV as DeploymentEnv];
        if (!config) {
            throw new Error('SOR: no config');
        }
        const url = config.url;
        const { data } = await axios.post<{ swapInfo: SwapInfo }>(url, {
            swapType,
            tokenIn,
            tokenOut,
            swapAmountScaled,
            swapOptions: {
                maxPools: swapOptions.maxPools || config.maxPools,
                forceRefresh: swapOptions.forceRefresh || config.forceRefresh,
            },
        });
        const swapInfo = data.swapInfo;
        return swapInfo;
    }

    private getTokenDecimals(tokenAddress: string, tokens: PrismaToken[]): number {
        if (
            tokenAddress === ZERO_ADDRESS ||
            tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
            tokenAddress === '0x0000000000000000000000000000000000001010'
        ) {
            return 18;
        }

        tokenAddress = tokenAddress.toLowerCase();
        const match = tokens.find((token) => token.address === tokenAddress);

        let decimals = match?.decimals;
        if (!decimals) {
            console.error(`Unknown token: ${tokenAddress}`);
            decimals = 18;
        }

        return decimals;
    }
}

export const balancerSorService = new BalancerSorService();
