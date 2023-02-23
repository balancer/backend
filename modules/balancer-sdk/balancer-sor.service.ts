import { GqlSorGetSwapsResponse, GqlSorSwapOptionsInput, GqlSorSwapType } from '../../schema';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { PrismaToken } from '@prisma/client';
import { poolService } from '../pool/pool.service';
import { oldBnum } from '../big-number/old-big-number';
import axios from 'axios';
import { FundManagement, SwapInfo, SwapTypes, SwapV2 } from '@balancer-labs/sdk';
import { replaceEthWithZeroAddress, replaceZeroAddressWithEth } from '../web3/addresses';
import { BigNumber } from 'ethers';
import { TokenAmountHumanReadable } from '../common/global-types';
import { AddressZero } from '@ethersproject/constants';
import { Contract } from '@ethersproject/contracts';
import VaultAbi from '../pool/abi/Vault.json';
import { env } from '../../app/env';
import { networkContext } from '../network/network-context.service';
import { DeploymentEnv } from '../network/network-config-types';
import * as Sentry from '@sentry/node';
import _ from 'lodash';
import { Logger } from 'ethers/lib/utils';

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
        let swapAmountScaled = BigNumber.from(`0`);
        try {
            swapAmountScaled = parseFixed(swapAmount, tokenDecimals);
        } catch (e) {
            console.log(`Invalid input: Could not parse swapAmount ${swapAmount} with decimals ${tokenDecimals}`);
            throw new Error('SOR: invalid swap amount input');
        }

        const { data } = await axios.post<{ swapInfo: SwapInfo }>(
            networkContext.data.sor[env.DEPLOYMENT_ENV as DeploymentEnv].url,
            {
                swapType,
                tokenIn,
                tokenOut,
                swapAmountScaled,
                swapOptions: {
                    maxPools:
                        swapOptions.maxPools || networkContext.data.sor[env.DEPLOYMENT_ENV as DeploymentEnv].maxPools,
                    forceRefresh:
                        swapOptions.forceRefresh ||
                        networkContext.data.sor[env.DEPLOYMENT_ENV as DeploymentEnv].forceRefresh,
                },
            },
        );
        const swapInfo = data.swapInfo;
        let deltas: string[] = [];

        try {
            deltas = await this.queryBatchSwap(
                swapType === 'EXACT_IN' ? SwapTypes.SwapExactIn : SwapTypes.SwapExactOut,
                swapInfo.swaps,
                swapInfo.tokenAddresses,
            );
        } catch (error: any) {
            const poolIds = _.uniq(swapInfo.swaps.map((swap) => swap.poolId));
            if (error.code === Logger.errors.CALL_EXCEPTION) {
                // Chances are a 304 means that we missed a pool draining event, and the pool data is stale.
                // We force an update on any pools inside of the swapInfo
                if (error.error?.error?.message?.includes('BAL#304')) {
                    Sentry.captureException(
                        `Received a BAL#304 during getSwaps, forcing an on-chain refresh for: ${poolIds.join(',')}`,
                        {
                            tags: {
                                tokenIn,
                                tokenOut,
                                swapType,
                                swapAmount,
                                swapPools: `${poolIds.join(',')}`,
                            },
                        },
                    );

                    const blockNumber = await networkContext.provider.getBlockNumber();

                    poolService.updateOnChainDataForPools(poolIds, blockNumber).catch();
                } else if (error.error?.error?.message?.includes('BAL#')) {
                    Sentry.captureException(
                        `Received an unhandled BAL error during getSwaps: ${error.error?.error?.message}`,
                        {
                            tags: {
                                tokenIn,
                                tokenOut,
                                swapType,
                                swapAmount,
                                swapPools: `${poolIds.join(',')}`,
                            },
                        },
                    );
                }
            }

            throw new Error(error);
        }

        const pools = await poolService.getGqlPools({
            where: {
                idIn: swapInfo.routes.map((route) => route.hops.map((hop) => hop.poolId)).flat(),
                chainIn: [networkContext.data.chain.gqlId],
            },
        });

        const tokenInAmount = BigNumber.from(deltas[swapInfo.tokenAddresses.indexOf(tokenIn)]);
        const tokenOutAmount = BigNumber.from(deltas[swapInfo.tokenAddresses.indexOf(tokenOut)]).abs();

        const swapAmountQuery = swapType === 'EXACT_OUT' ? tokenOutAmount : tokenInAmount;
        const returnAmount = swapType === 'EXACT_IN' ? tokenOutAmount : tokenInAmount;

        const returnAmountFixed = formatFixed(
            returnAmount,
            this.getTokenDecimals(swapType === 'EXACT_IN' ? tokenOut : tokenIn, tokens),
        );

        const swapAmountQueryFixed = formatFixed(
            swapAmountQuery,
            this.getTokenDecimals(swapType === 'EXACT_OUT' ? tokenOut : tokenIn, tokens),
        );

        const tokenInAmountFixed = formatFixed(tokenInAmount, this.getTokenDecimals(tokenIn, tokens));
        const tokenOutAmountFixed = formatFixed(tokenOutAmount, this.getTokenDecimals(tokenOut, tokens));

        const effectivePrice = oldBnum(tokenInAmountFixed).div(tokenOutAmountFixed);
        const effectivePriceReversed = oldBnum(tokenOutAmountFixed).div(tokenInAmountFixed);
        const priceImpact = effectivePrice.div(swapInfo.marketSp).minus(1);

        for (const route of swapInfo.routes) {
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
            ...swapInfo,
            tokenIn: replaceZeroAddressWithEth(swapInfo.tokenIn),
            tokenOut: replaceZeroAddressWithEth(swapInfo.tokenOut),
            swapType,
            tokenInAmount: tokenInAmountFixed,
            tokenOutAmount: tokenOutAmountFixed,
            swapAmount: swapAmountQueryFixed,
            swapAmountScaled: swapAmountQuery.toString(),
            swapAmountForSwaps: swapInfo.swapAmountForSwaps
                ? BigNumber.from(swapInfo.swapAmountForSwaps).toString()
                : undefined,
            returnAmount: returnAmountFixed,
            returnAmountScaled: returnAmount.toString(),
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
        const vaultContract = new Contract(networkContext.data.balancer.vault, VaultAbi, networkContext.provider);
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
