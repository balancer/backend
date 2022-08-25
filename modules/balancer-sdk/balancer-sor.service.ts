import { GqlSorGetSwapsResponse, GqlSorSwapOptionsInput, GqlSorSwapType } from '../../schema';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { PrismaToken } from '@prisma/client';
import { poolService } from '../pool/pool.service';
import { oldBnum } from '../big-number/old-big-number';
import axios from 'axios';
import { FundManagement, SwapInfo, SwapTypes, SwapV2 } from '@balancer-labs/sdk';
import { replaceEthWithZeroAddress, replaceZeroAddressWithEth } from '../web3/addresses';
import { networkConfig, DeploymentEnv } from '../config/network-config';
import { BigNumber } from 'ethers';
import { TokenAmountHumanReadable } from '../common/global-types';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import VaultAbi from '../pool/abi/Vault.json';
import { jsonRpcProvider } from '../web3/contract';
import { balancerSdk } from './src/balancer-sdk';
import { env } from '../../app/env';

interface GetSwapsInput {
    tokenIn: string;
    tokenOut: string;
    swapType: GqlSorSwapType;
    swapAmount: string;
    swapOptions: GqlSorSwapOptionsInput;
    tokens: PrismaToken[];
}

export class BalancerSorService {
    public async getSwaps({
        tokenIn,
        tokenOut,
        swapType,
        swapOptions,
        swapAmount,
        tokens,
    }: GetSwapsInput): Promise<GqlSorGetSwapsResponse> {
        tokenIn = replaceEthWithZeroAddress(tokenIn);
        tokenOut = replaceEthWithZeroAddress(tokenOut);

        const tokenDecimals = this.getTokenDecimals(swapType === 'EXACT_IN' ? tokenIn : tokenOut, tokens);
        const swapAmountScaled = parseFixed(swapAmount, tokenDecimals);

        const { data } = await axios.post<{ swapInfo: SwapInfo }>(
            networkConfig.sor[env.DEPLOYMENT_ENV as DeploymentEnv].url,
            {
                swapType,
                tokenIn,
                tokenOut,
                swapAmountScaled,
                swapOptions: {
                    maxPools: swapOptions.maxPools || 8,
                    forceRefresh: swapOptions.forceRefresh || false,
                },
            },
        );
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
            tokenIn: replaceZeroAddressWithEth(swapInfo.tokenIn),
            tokenOut: replaceZeroAddressWithEth(swapInfo.tokenOut),
            swapType,
            tokenInAmount,
            tokenOutAmount,
            swapAmount,
            swapAmountScaled: BigNumber.from(swapInfo.swapAmount).toString(),
            swapAmountForSwaps: swapInfo.swapAmountForSwaps
                ? BigNumber.from(swapInfo.swapAmountForSwaps).toString()
                : undefined,
            returnAmount,
            returnAmountScaled: BigNumber.from(swapInfo.returnAmount).toString(),
            returnAmountConsideringFees: BigNumber.from(swapInfo.returnAmountConsideringFees).toString(),
            returnAmountFromSwaps: swapInfo.returnAmountFromSwaps
                ? BigNumber.from(swapInfo.returnAmountFromSwaps).toString()
                : undefined,
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

    public async getBatchSwapForTokensIn({
        tokensIn,
        tokenOut,
        swapOptions,
        tokens,
    }: {
        tokensIn: TokenAmountHumanReadable[];
        tokenOut: string;
        swapOptions: GqlSorSwapOptionsInput;
        tokens: PrismaToken[];
    }): Promise<{ tokenOutAmount: string; swaps: SwapV2[]; assets: string[] }> {
        const swaps: SwapV2[][] = [];
        const assetArray: string[][] = [];
        // get path information for each tokenIn
        for (let i = 0; i < tokensIn.length; i++) {
            const response = await this.getSwaps({
                tokenIn: tokensIn[i].address,
                swapAmount: tokensIn[i].amount,
                tokenOut,
                swapType: 'EXACT_IN',
                swapOptions,
                tokens,
            });

            console.log(tokensIn[i].address, response.swaps);
            console.log(tokensIn[i].address, response.tokenAddresses);

            swaps.push(response.swaps);
            assetArray.push(response.tokenAddresses);
        }

        // Join swaps and assets together correctly
        const batchedSwaps = this.batchSwaps(assetArray, swaps);

        console.log('batchedSwaps', batchedSwaps);

        let tokenOutAmountScaled = '0';
        try {
            // Onchain query
            const deltas = await this.queryBatchSwap(SwapTypes.SwapExactIn, batchedSwaps.swaps, batchedSwaps.assets);
            tokenOutAmountScaled = deltas[batchedSwaps.assets.indexOf(tokenOut.toLowerCase())] ?? '0';
        } catch (err) {
            console.log(`queryBatchSwapTokensIn error: `, err);
        }

        const tokenOutAmount = formatFixed(tokenOutAmountScaled, this.getTokenDecimals(tokenOut, tokens));

        return {
            tokenOutAmount,
            swaps: batchedSwaps.swaps,
            assets: batchedSwaps.assets,
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

    private batchSwaps(assetArray: string[][], swaps: SwapV2[][]): { swaps: SwapV2[]; assets: string[] } {
        // assest addresses without duplicates
        const newAssetArray = [...new Set(assetArray.flat())];

        // Update indices of each swap to use new asset array
        swaps.forEach((swap, i) => {
            swap.forEach((poolSwap) => {
                poolSwap.assetInIndex = newAssetArray.indexOf(assetArray[i][poolSwap.assetInIndex]);
                poolSwap.assetOutIndex = newAssetArray.indexOf(assetArray[i][poolSwap.assetOutIndex]);
            });
        });

        // Join Swaps into a single batchSwap
        const batchedSwaps = swaps.flat();
        return { swaps: batchedSwaps, assets: newAssetArray };
    }

    private queryBatchSwap(swapType: SwapTypes, swaps: SwapV2[], assets: string[]): Promise<string[]> {
        const vaultContract = new Contract(networkConfig.balancer.vault, VaultAbi, jsonRpcProvider);
        const funds: FundManagement = {
            sender: AddressZero,
            recipient: AddressZero,
            fromInternalBalance: false,
            toInternalBalance: false,
        };

        return vaultContract.queryBatchSwap(swapType, swaps, assets, funds);
    }
}

export const balancerSorService = new BalancerSorService();
