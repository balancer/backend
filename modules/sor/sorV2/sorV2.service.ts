import { GqlSorGetSwapPaths, GqlSorPath, GqlSorSwap, GqlSorSwapRoute, GqlSorSwapType } from '../../../schema';
import { Chain } from '@prisma/client';
import { PrismaPoolWithDynamic, prismaPoolWithDynamic } from '../../../prisma/prisma-types';
import { prisma } from '../../../prisma/prisma-client';
import { GetSwapsInput, GetSwapsV2Input as GetSwapPathsInput, SwapResult, SwapService } from '../types';
import { poolsToIgnore } from '../constants';
import { AllNetworkConfigsKeyedOnChain, chainToIdMap } from '../../network/network-config';
import * as Sentry from '@sentry/node';
import { Address, formatUnits } from 'viem';
import { sorGetSwapsWithPools as sorGetPathsWithPools } from './lib/static';
import { SwapResultV2 } from './swapResultV2';
import { poolService } from '../../pool/pool.service';
import { mapRoutes } from './beetsHelpers';
import { replaceZeroAddressWithEth } from '../../web3/addresses';
import { getToken, swapPathsZeroResponse } from '../utils';
import { BatchSwapStep, SingleSwap, Swap, SwapKind, TokenAmount } from '@balancer/sdk';
import { PathWithAmount } from './lib/path';
import { calculatePriceImpact, getInputAmount, getOutputAmount, getSwaps } from './lib/utils/helpers';
import { SwapLocal } from './lib/swapLocal';
import { query } from 'express';
import { update } from 'lodash';

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
            const paths = await sorGetPathsWithPools(tIn, tOut, swapKind, swapAmount.amount, poolsFromDb, config);
            if (!paths && maxNonBoostedPathDepth < 5) {
                return this.getSwapResult(arguments[0], maxNonBoostedPathDepth + 1);
            }
            if (!paths) {
                return new SwapResultV2(null, chain);
            }

            const swap = new SwapLocal({ paths: paths, swapKind });

            return new SwapResultV2(swap, chain);
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
            return new SwapResultV2(null, chain);
        }
    }

    public async getSorSwapPaths(input: GetSwapPathsInput, maxNonBoostedPathDepth = 4): Promise<GqlSorGetSwapPaths> {
        const paths = await this.getSwapPathsFromSor(input, maxNonBoostedPathDepth);
        const emptyResponse = swapPathsZeroResponse(input.tokenIn, input.tokenOut);

        if (!paths) {
            return emptyResponse;
        }

        try {
            return this.mapToSorSwapPaths(paths!, input.swapType, input.chain, input.queryBatchSwap);
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

    private async getSwapPathsFromSor(
        { chain, tokenIn, tokenOut, swapType, swapAmount, graphTraversalConfig }: GetSwapPathsInput,
        maxNonBoostedPathDepth = 4,
    ): Promise<PathWithAmount[] | null> {
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
            const paths = await sorGetPathsWithPools(tIn, tOut, swapKind, swapAmount.amount, poolsFromDb, config);
            // if we dont find a path with depth 4, we try one more level.
            if (!paths && maxNonBoostedPathDepth < 5) {
                return this.getSwapPathsFromSor(arguments[0], maxNonBoostedPathDepth + 1);
            }
            return paths;
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

    public async mapToSorSwapPaths(
        paths: PathWithAmount[],
        swapType: GqlSorSwapType,
        chain: Chain,
        queryFirst = false,
    ): Promise<GqlSorGetSwapPaths> {
        const swapKind = this.mapSwapTypeToSwapKind(swapType);

        let updatedAmount;
        if (queryFirst) {
            const sdkSwap = new Swap({
                chainId: parseFloat(chainToIdMap[chain]),
                paths: paths.map((path) => ({
                    vaultVersion: 2 as 2 | 3,
                    inputAmountRaw: path.inputAmount.amount,
                    outputAmountRaw: path.outputAmount.amount,
                    tokens: path.tokens.map((token) => ({
                        address: token.address,
                        decimals: token.decimals,
                    })),
                    pools: path.pools.map((pool) => pool.id),
                })),
                swapKind,
            });

            updatedAmount = await sdkSwap.query(AllNetworkConfigsKeyedOnChain[chain].data.rpcUrl);
        }

        let inputAmount = getInputAmount(paths);
        let outputAmount = getOutputAmount(paths);

        // only total inputAmount or outputAmount is updated. We can't inputAmount or outputAmount per path.
        // this means that also subsequent calcs dont take the updatedAmount into account, i.e. priceImpact, paths and routes
        if (updatedAmount) {
            inputAmount = swapKind === SwapKind.GivenIn ? inputAmount : updatedAmount;
            outputAmount = swapKind === SwapKind.GivenIn ? updatedAmount : outputAmount;
        }

        // price impact does not take the updatedAmount into account
        const priceImpact = calculatePriceImpact(paths, swapKind).decimal.toFixed(4);

        let poolIds: string[] = [];

        for (const path of paths) {
            poolIds.push(...path.pools.map((pool) => pool.id));
        }

        const pools = await poolService.getGqlPools({
            where: { idIn: poolIds },
        });

        const sorPaths: GqlSorPath[] = [];
        for (const path of paths) {
            // map paths used as input for b-sdk for client
            sorPaths.push({
                vaultVersion: 2,
                inputAmountRaw: path.inputAmount.amount.toString(),
                outputAmountRaw: path.outputAmount.amount.toString(),
                tokens: path.tokens.map((token) => ({
                    address: token.address,
                    decimals: token.decimals,
                })),
                pools: path.pools.map((pool) => pool.id),
            });
        }

        const returnAmount = swapKind === SwapKind.GivenIn ? outputAmount : inputAmount;
        const swapAmount = swapKind === SwapKind.GivenIn ? inputAmount : outputAmount;

        const effectivePrice = inputAmount.divDownFixed(outputAmount.amount);
        const effectivePriceReversed = outputAmount.divDownFixed(inputAmount.amount);

        // routes are used for displaying on the UI
        const routes = mapRoutes(paths, pools);

        return {
            vaultVersion: 2,
            paths: sorPaths,
            swapType,
            swaps: this.mapSwaps(paths, swapKind),
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

    private mapSwaps(paths: PathWithAmount[], swapKind: SwapKind): GqlSorSwap[] {
        const swaps = getSwaps(paths, swapKind);
        const assets = [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))];

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

    private getSwapFromPaths(paths: PathWithAmount[] | null): Swap {
        throw new Error('Function not implemented.');
    }
}

export const sorV2Service = new SorV2Service();
