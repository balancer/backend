import { GqlSorGetSwaps, GqlSorSwap, GqlSorSwapType } from '../../../schema';
import { Chain } from '@prisma/client';
import { PrismaPoolWithDynamic, prismaPoolWithDynamic } from '../../../prisma/prisma-types';
import { prisma } from '../../../prisma/prisma-client';
import { GetSwapsInput, SwapResult, SwapService } from '../types';
import { env } from '../../../app/env';
import { DeploymentEnv } from '../../network/network-config-types';
import { poolsToIgnore } from '../constants';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';
import * as Sentry from '@sentry/node';
import { getToken } from '../utils';
import { Swap } from './sor-port/swap';
import { Address } from 'viem';
import { BatchSwapStep, SingleSwap, SwapKind } from './sor-port/types';
import { sorGetSwapsWithPools } from './sor-port/static';
import { SwapResultV2 } from './swapResultV2';
import { TokenAmount } from './sor-port/tokenAmount';
import { poolService } from '../../pool/pool.service';
import { mapRoutes } from './beetsHelpers';
import { replaceZeroAddressWithEth } from '../../web3/addresses';
import { formatFixed } from '@ethersproject/bignumber';

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

    public async getSwap(
        { chain, tokenIn, tokenOut, swapType, swapAmount, graphTraversalConfig }: GetSwapsInput,
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
            if (!swap && maxNonBoostedPathDepth < 5) {
                return swap;
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

    public async mapToSorSwaps(swap: Swap, chain: Chain, queryFirst = false): Promise<GqlSorGetSwaps> {
        if (!queryFirst) return this.mapSwapToSorGetSwaps(swap, swap.inputAmount, swap.outputAmount);
        else {
            const rpcUrl = AllNetworkConfigsKeyedOnChain[chain].data.rpcUrl;
            const balancerQueriesAddress = AllNetworkConfigsKeyedOnChain[chain].data.balancer.v2.balancerQueriesAddress;
            const updatedResult = await swap.query(rpcUrl, balancerQueriesAddress as Address);

            const inputAmount = swap.swapKind === SwapKind.GivenIn ? swap.inputAmount : updatedResult;
            const outputAmount = swap.swapKind === SwapKind.GivenIn ? updatedResult : swap.outputAmount;

            return this.mapSwapToSorGetSwaps(swap, inputAmount, outputAmount);
        }
    }

    private async mapSwapToSorGetSwaps(
        swap: Swap,
        inputAmount: TokenAmount,
        outputAmount: TokenAmount,
    ): Promise<GqlSorGetSwaps> {
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

        const returnAmount =
            swap.swapKind === SwapKind.GivenIn ? outputAmount.amount.toString() : inputAmount.amount.toString();
        const swapAmount =
            swap.swapKind === SwapKind.GivenIn ? inputAmount.amount.toString() : outputAmount.amount.toString();

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
            route.tokenInAmount = (inputAmount.amount * BigInt(route.share)).toString();
            route.tokenOutAmount = (outputAmount.amount * BigInt(route.share)).toString();
        }

        return {
            swaps: this.mapSwaps(swap.swaps, swap.assets),
            tokenAddresses: swap.assets,
            tokenIn: replaceZeroAddressWithEth(inputAmount.token.address),
            tokenOut: replaceZeroAddressWithEth(outputAmount.token.address),
            swapType: this.mapSwapKindToSwapType(swap.swapKind),
            tokenInAmount: inputAmount.amount.toString(),
            tokenOutAmount: outputAmount.amount.toString(),
            swapAmount: swapAmount,
            returnAmount: returnAmount,
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

    private mapSwapKindToSwapType(kind: SwapKind): GqlSorSwapType {
        return kind === SwapKind.GivenIn ? 'EXACT_IN' : 'EXACT_OUT';
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
        const { poolIdsToExclude } = AllNetworkConfigsKeyedOnChain[chain].data.sor[env.DEPLOYMENT_ENV as DeploymentEnv];
        const pools = await prisma.prismaPool.findMany({
            where: {
                chain,
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                    swapEnabled: true,
                    totalLiquidity: {
                        gt: 50,
                    },
                },
                id: {
                    notIn: [...poolIdsToExclude, ...poolsToIgnore],
                },
                type: {
                    notIn: [
                        'LINEAR', // Linear pools are sunset so ignore to avoid issues related to lack of support
                        'LIQUIDITY_BOOTSTRAPPING', // not supported by b-sdk
                        'ELEMENT', // not supported by b-sdk
                        'UNKNOWN', // not supported by b-sdk
                        'INVESTMENT', // not supported by b-sdk
                        'STABLE', // not supported by b-sdk
                    ],
                },
            },
            include: prismaPoolWithDynamic.include,
        });
        return pools;
    }
}

export const sorV2Service = new SorV2Service();
