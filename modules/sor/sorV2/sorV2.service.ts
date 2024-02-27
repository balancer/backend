import { GqlSorGetSwapPaths, GqlSorSwap, GqlSorSwapType } from '../../../schema';
import { Chain } from '@prisma/client';
import { PrismaPoolWithDynamic, prismaPoolWithDynamic } from '../../../prisma/prisma-types';
import { prisma } from '../../../prisma/prisma-client';
import { GetSwapsInput, GetSwapsV2Input as GetSwapPathsInput, SwapResult, SwapService } from '../types';
import { env } from '../../../app/env';
import { DeploymentEnv } from '../../network/network-config-types';
import { poolsToIgnore } from '../constants';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';
import * as Sentry from '@sentry/node';
import { Address, formatUnits, parseUnits } from 'viem';
import { sorGetSwapsWithPools } from './lib/static';
import { SwapResultV2 } from './swapResultV2';
import { poolService } from '../../pool/pool.service';
import { mapPaths, mapRoutes } from './beetsHelpers';
import { replaceZeroAddressWithEth } from '../../web3/addresses';
import { getToken, swapPathsZeroResponse } from '../utils';
import { BatchSwapStep, SingleSwap, Swap, SwapKind, TokenAmount } from '@balancer/sdk';
import { Token } from 'graphql';

export class SorV2Service implements SwapService {
    public async getSwapResult(
        { chain, tokenIn, tokenOut, swapType, swapAmount, graphTraversalConfig }: GetSwapsInput,
        maxNonBoostedPathDepth = 4,
    ): Promise<SwapResult> {
        try {
            const poolsFromDb = await this.getBasePoolsFromDb(chain);
            const tIn = await getToken(tokenIn as Address, chain);
            const tOut = await getToken(tokenOut as Address, chain);
            const swapKind = this.mapSwapTypeToSwapKind(swapType);
            const config = graphTraversalConfig
                ? {
                      graphTraversalConfig: {
                          maxNonBoostedPathDepth,
                          ...graphTraversalConfig,
                      },
                  }
                : {
                      graphTraversalConfig: {
                          maxNonBoostedPathDepth,
                      },
                  };
            const swap = await sorGetSwapsWithPools(tIn, tOut, swapKind, swapAmount.amount, poolsFromDb, config);
            if (!swap && maxNonBoostedPathDepth < 5) {
                return this.getSwapResult(arguments[0], maxNonBoostedPathDepth + 1);
            }
            return new SwapResultV2(swap, chain);
        } catch (err: any) {
            if (err.message.includes('No potential swap paths provided') && maxNonBoostedPathDepth < 5) {
                return this.getSwapResult(arguments[0], maxNonBoostedPathDepth + 1);
            }
            console.error(
                `SOR_V2_ERROR ${err.message} - tokenIn: ${tokenIn} - tokenOut: ${tokenOut} - swapAmount: ${swapAmount.amount} - swapType: ${swapType} - chain: ${chain}`,
            );
            Sentry.captureException(err.message, {
                tags: {
                    service: 'sorV2',
                    tokenIn,
                    tokenOut,
                    swapAmount: swapAmount.amount,
                    swapType,
                    chain,
                },
            });
            return new SwapResultV2(null, chain);
        }
    }

    public async getSorSwapPaths(input: GetSwapPathsInput, maxNonBoostedPathDepth = 4): Promise<GqlSorGetSwapPaths> {
        const swap = await this.getSwap(input, maxNonBoostedPathDepth);
        const emptyResponse = swapPathsZeroResponse(input.tokenIn, input.tokenOut);

        if (!swap) {
            return emptyResponse;
        }

        try {
            return this.mapToSorSwapPaths(swap!, input.chain, input.queryBatchSwap);
        } catch (err: any) {
            console.log(`Error Retrieving QuerySwap`, err);
            Sentry.captureException(err.message, {
                tags: {
                    service: 'sorV2 query swap',
                    tokenIn: input.tokenIn,
                    tokenOut: input.tokenOut,
                    swapAmount: formatUnits(input.swapAmount.amount, input.swapAmount.token.decimals),
                    swapType: input.swapType,
                    chain: input.chain,
                },
            });
            return emptyResponse;
        }
    }

    private async getSwap(
        { chain, tokenIn, tokenOut, swapType, swapAmount, graphTraversalConfig }: GetSwapPathsInput,
        maxNonBoostedPathDepth = 4,
    ): Promise<Swap | null> {
        try {
            const poolsFromDb = await this.getBasePoolsFromDb(chain);
            const tIn = await getToken(tokenIn as Address, chain);
            const tOut = await getToken(tokenOut as Address, chain);
            const swapKind = this.mapSwapTypeToSwapKind(swapType);
            const config = graphTraversalConfig
                ? {
                      graphTraversalConfig: {
                          maxNonBoostedPathDepth,
                          ...graphTraversalConfig,
                      },
                  }
                : {
                      graphTraversalConfig: {
                          maxNonBoostedPathDepth,
                      },
                  };
            const swap = await sorGetSwapsWithPools(tIn, tOut, swapKind, swapAmount.amount, poolsFromDb, config);
            // if we dont find a path with depth 4, we try one more level.
            if (!swap && maxNonBoostedPathDepth < 5) {
                return this.getSwap(arguments[0], maxNonBoostedPathDepth + 1);
            }
            return swap;
        } catch (err: any) {
            console.error(
                `SOR_V2_ERROR ${err.message} - tokenIn: ${tokenIn} - tokenOut: ${tokenOut} - swapAmount: ${swapAmount.amount} - swapType: ${swapType} - chain: ${chain}`,
            );
            Sentry.captureException(err.message, {
                tags: {
                    service: 'sorV2',
                    tokenIn,
                    tokenOut,
                    swapAmount: swapAmount.amount,
                    swapType,
                    chain,
                },
            });
            return null;
        }
    }

    public async mapToSorSwapPaths(swap: Swap, chain: Chain, queryFirst = false): Promise<GqlSorGetSwapPaths> {
        if (!queryFirst) return this.mapSwapToSorGetSwaps(swap, swap.inputAmount, swap.outputAmount);
        else {
            const rpcUrl = AllNetworkConfigsKeyedOnChain[chain].data.rpcUrl;
            const updatedResult = await swap.query(rpcUrl);

            const inputAmount = swap.swapKind === SwapKind.GivenIn ? swap.inputAmount : updatedResult;
            const outputAmount = swap.swapKind === SwapKind.GivenIn ? updatedResult : swap.outputAmount;

            return this.mapSwapToSorGetSwaps(swap, inputAmount, outputAmount);
        }
    }

    private async mapSwapToSorGetSwaps(
        swap: Swap,
        inputAmount: TokenAmount,
        outputAmount: TokenAmount,
    ): Promise<GqlSorGetSwapPaths> {
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

        const returnAmount = swap.swapKind === SwapKind.GivenIn ? outputAmount : inputAmount;
        const swapAmount = swap.swapKind === SwapKind.GivenIn ? inputAmount : outputAmount;

        const effectivePrice = inputAmount.divDownFixed(outputAmount.amount);
        const effectivePriceReversed = outputAmount.divDownFixed(inputAmount.amount);

        console.log(effectivePrice.amount);
        console.log(effectivePriceReversed.amount);

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

        const paths = mapPaths(swap);

        for (const route of routes) {
            route.tokenInAmount = ((inputAmount.amount * BigInt(parseUnits(`${0.5}`, 6))) / 1000000n).toString();
            route.tokenOutAmount = (
                (outputAmount.amount * BigInt(parseUnits(`${route.share}`, 6))) /
                1000000n
            ).toString();
        }

        return {
            vaultVersion: 2,
            paths: paths,
            swapType: this.mapSwapKindToSwapType(swap.swapKind),
            swaps: this.mapSwaps(swap.swaps, swap.assets),
            tokenIn: replaceZeroAddressWithEth(inputAmount.token.address),
            tokenOut: replaceZeroAddressWithEth(outputAmount.token.address),
            tokenInAmount: inputAmount.amount.toString(),
            tokenOutAmount: outputAmount.amount.toString(),
            swapAmount: formatUnits(swapAmount.amount, swapAmount.token.decimals),
            swapAmountScaled: swapAmount.amount.toString(),
            returnAmount: formatUnits(returnAmount.amount, returnAmount.token.decimals),
            returnAmountScaled: returnAmount.amount.toString(),
            effectivePrice: formatUnits(effectivePrice.amount, effectivePrice.token.decimals),
            effectivePriceReversed: formatUnits(effectivePriceReversed.amount, effectivePriceReversed.token.decimals),
            routes: routes.map((route) => ({
                ...route,
                hops: route.hops.map((hop) => ({
                    ...hop,
                    pool: pools.find((pool) => pool.id === hop.poolId)!,
                })),
            })),
            priceImpact: priceImpact,
        };
    }

    private mapSwapTypeToSwapKind(swapType: GqlSorSwapType): SwapKind {
        return swapType === 'EXACT_IN' ? SwapKind.GivenIn : SwapKind.GivenOut;
    }

    private mapSwapKindToSwapType(swapKind: SwapKind): GqlSorSwapType {
        return swapKind === SwapKind.GivenIn ? 'EXACT_IN' : 'EXACT_OUT';
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

    /**
     * Fetch pools from Prisma and map to b-sdk BasePool.
     * @returns
     */
    private async getBasePoolsFromDb(chain: Chain): Promise<PrismaPoolWithDynamic[]> {
        const poolIdsToExclude = AllNetworkConfigsKeyedOnChain[chain].data.sor?.poolIdsToExclude ?? [];
        const pools = await prisma.prismaPool.findMany({
            where: {
                chain,
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                    swapEnabled: true,
                    totalLiquidity: {
                        gt: 1000,
                    },
                },
                id: {
                    notIn: [...poolIdsToExclude, ...poolsToIgnore],
                },
                type: {
                    in: [
                        'WEIGHTED',
                        'META_STABLE',
                        'PHANTOM_STABLE',
                        'COMPOSABLE_STABLE',
                        'FX',
                        'GYRO',
                        'GYRO3',
                        'GYROE',
                    ],
                },
            },
            include: prismaPoolWithDynamic.include,
        });
        return pools;
    }
}

export const sorV2Service = new SorV2Service();
