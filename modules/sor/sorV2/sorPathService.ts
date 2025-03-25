import {
    GqlPoolMinimal,
    GqlSorCallData,
    GqlSorGetSwapPaths,
    GqlSorPath,
    GqlSorSwap,
    GqlSorSwapRoute,
    GqlSorSwapRouteHop,
    GqlSorSwapType,
} from '../../../apps/api/gql/generated-schema';
import { Chain } from '@prisma/client';
import { GetSwapsV2Input as GetSwapPathsInput } from '../types';
import * as Sentry from '@sentry/node';
import { Address, formatUnits } from 'viem';
import { sorGetPathsWithPools } from './lib/static';
import { poolService } from '../../pool/pool.service';
import { replaceZeroAddressWithEth } from '../../web3/addresses';
import { getToken, swapPathsZeroResponse } from '../utils';
import { BatchSwapStep, DEFAULT_USERDATA, SingleSwap, TokenAmount, SwapKind } from '@balancer/sdk';
import { PathWithAmount } from './lib/path';
import { getInputAmount, getOutputAmount } from './lib/utils/helpers';
import { getBasePoolsFromDb } from '../utils/pool';

class SorPathService {
    // The new SOR service
    public async getSorSwapPaths(input: GetSwapPathsInput, maxNonBoostedPathDepth = 4): Promise<GqlSorGetSwapPaths> {
        const paths = await this.getSwapPathsFromSor(input, maxNonBoostedPathDepth);
        const emptyResponse = swapPathsZeroResponse(input.tokenIn, input.tokenOut, input.chain);

        if (!paths) {
            return emptyResponse;
        }

        return this.mapToSorSwapPaths(paths!, input.swapType, input.chain, input.protocolVersion as 2 | 3);
    }

    private async getSwapPathsFromSor(
        {
            chain,
            tokenIn,
            tokenOut,
            swapType,
            swapAmount,
            protocolVersion,
            graphTraversalConfig,
            considerPoolsWithHooks,
            poolIds,
        }: GetSwapPathsInput,
        maxNonBoostedPathDepth = 4,
    ): Promise<PathWithAmount[] | null> {
        try {
            const { pools: poolsFromDb, underlyingTokens } = await getBasePoolsFromDb(
                chain,
                protocolVersion,
                considerPoolsWithHooks,
                poolIds,
            );
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
            const paths = await sorGetPathsWithPools(
                tIn,
                tOut,
                swapKind,
                swapAmount.amount,
                poolsFromDb,
                underlyingTokens,
                protocolVersion,
                config,
            );
            // if we dont find a path with depth 4, we try one more level.
            if (!paths && maxNonBoostedPathDepth < 5) {
                // TODO: we should be able to refactor this 'retry' logic so it's configurable from outside instead of hardcoding it here
                return this.getSwapPathsFromSor(arguments[0], maxNonBoostedPathDepth + 1);
            }
            return paths;
        } catch (err: any) {
            console.log(
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

    // map the SOR output to the required response type
    private async mapToSorSwapPaths(
        paths: PathWithAmount[],
        swapType: GqlSorSwapType,
        chain: Chain,
        protocolVersion: 2 | 3,
    ): Promise<GqlSorGetSwapPaths> {
        const swapKind = this.mapSwapTypeToSwapKind(swapType);

        let inputAmount = getInputAmount(paths);
        let outputAmount = getOutputAmount(paths);

        const callData: GqlSorCallData | undefined = undefined;
        const priceImpact = undefined;
        const priceImpactError =
            'Price impact could not be calculated for this path. The swap path is still valid and can be executed.';

        // get all affected pools
        let poolIds: string[] = [];
        for (const path of paths) {
            poolIds.push(...path.pools.map((pool) => pool.id));
        }
        const pools = await poolService.getGqlPools({
            where: { idIn: poolIds },
        });

        const sorPaths: GqlSorPath[] = [];
        for (const path of paths) {
            // paths used as input for b-sdk for client
            sorPaths.push({
                protocolVersion,
                vaultVersion: protocolVersion,
                inputAmountRaw: path.inputAmount.amount.toString(),
                outputAmountRaw: path.outputAmount.amount.toString(),
                tokens: path.tokens.map((token) => ({
                    address: token.address,
                    decimals: token.decimals,
                })),
                pools: path.pools.map((pool) => pool.id),
                isBuffer: path.isBuffer,
            });
        }

        const returnAmount = swapKind === SwapKind.GivenIn ? outputAmount : inputAmount;
        const swapAmount = swapKind === SwapKind.GivenIn ? inputAmount : outputAmount;

        const effectivePrice = outputAmount.amount > 0 ? inputAmount.divDownFixed(outputAmount.scale18) : Infinity;
        const effectivePriceReversed = outputAmount.divDownFixed(inputAmount.scale18);

        return {
            protocolVersion,
            vaultVersion: protocolVersion,
            paths: sorPaths,
            swapType,
            swaps: this.mapSwaps(paths, swapKind),
            tokenAddresses: [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))],
            tokenIn: replaceZeroAddressWithEth(inputAmount.token.address, chain),
            tokenOut: replaceZeroAddressWithEth(outputAmount.token.address, chain),
            tokenInAmount: inputAmount.amount.toString(),
            tokenOutAmount: outputAmount.amount.toString(),
            swapAmount: formatUnits(swapAmount.amount, swapAmount.token.decimals),
            swapAmountRaw: swapAmount.amount.toString(),
            returnAmount: formatUnits(returnAmount.amount, returnAmount.token.decimals),
            returnAmountRaw: returnAmount.amount.toString(),
            effectivePrice:
                effectivePrice === Infinity
                    ? 'Infinity'
                    : formatUnits(
                          (effectivePrice as TokenAmount).amount,
                          (effectivePrice as TokenAmount).token.decimals,
                      ),
            effectivePriceReversed: formatUnits(effectivePriceReversed.amount, effectivePriceReversed.token.decimals),
            routes: this.mapRoutes(paths, pools),
            priceImpact: {
                priceImpact: priceImpact,
                error: priceImpactError,
            },
            callData,
        };
    }

    private mapSwapTypeToSwapKind(swapType: GqlSorSwapType): SwapKind {
        return swapType === 'EXACT_IN' ? SwapKind.GivenIn : SwapKind.GivenOut;
    }

    private mapSwaps(paths: PathWithAmount[], swapKind: SwapKind): GqlSorSwap[] {
        const swaps = this.getSwaps(paths, swapKind);
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

    private getSwaps(paths: PathWithAmount[], swapKind: SwapKind) {
        const isBatchSwap = paths.length > 1 || paths[0].pools.length > 1;
        const assets = [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))];

        let swaps: BatchSwapStep[] | SingleSwap;
        if (isBatchSwap) {
            swaps = [] as BatchSwapStep[];
            if (swapKind === SwapKind.GivenIn) {
                paths.map((p) => {
                    p.pools.map((pool, i) => {
                        (swaps as BatchSwapStep[]).push({
                            poolId: pool.id,
                            assetInIndex: BigInt(assets.indexOf(p.tokens[i].address)),
                            assetOutIndex: BigInt(assets.indexOf(p.tokens[i + 1].address)),
                            amount: i === 0 ? p.inputAmount.amount : 0n,
                            userData: DEFAULT_USERDATA,
                        });
                    });
                });
            } else {
                paths.map((p) => {
                    // Vault expects given out swaps to be in reverse order
                    const reversedPools = [...p.pools].reverse();
                    const reversedTokens = [...p.tokens].reverse();
                    reversedPools.map((pool, i) => {
                        (swaps as BatchSwapStep[]).push({
                            poolId: pool.id,
                            assetInIndex: BigInt(assets.indexOf(reversedTokens[i + 1].address)),
                            assetOutIndex: BigInt(assets.indexOf(reversedTokens[i].address)),
                            amount: i === 0 ? p.outputAmount.amount : 0n,
                            userData: DEFAULT_USERDATA,
                        });
                    });
                });
            }
        } else {
            const path = paths[0];
            const pool = path.pools[0];
            swaps = {
                poolId: pool.id,
                kind: swapKind,
                assetIn: path.tokens[0].address,
                assetOut: path.tokens[1].address,
                amount: path.swapAmount.amount,
                userData: DEFAULT_USERDATA,
            } as SingleSwap;
        }
        return swaps;
    }

    private mapRoutes(paths: PathWithAmount[], pools: GqlPoolMinimal[]): GqlSorSwapRoute[] {
        const isBatchSwap = paths.length > 1 || paths[0].pools.length > 1;

        if (!isBatchSwap) {
            if (pools.length === 0) {
                // this scenario happens when swapping through a single buffer (wrap/unwrap erc4626)
                // TODO: check with the team who's consuming `route` and if it's ok to return an empty array
                // or if we should try to build a GqlSorSwapRoute from the buffer data
                return [];
            }
            const pool = pools.find((p) => p.id === paths[0].pools[0].id);
            if (!pool) throw new Error('Pool not found while mapping route');
            return [this.mapSingleSwap(paths[0], pool)];
        }
        return paths.map((path) => this.mapBatchSwap(path, pools));
    }

    private mapBatchSwap(path: PathWithAmount, pools: GqlPoolMinimal[]): GqlSorSwapRoute {
        const tokenIn = path.tokens[0].address;
        const tokenOut = path.tokens[path.tokens.length - 1].address;
        const tokenInAmount = formatUnits(path.inputAmount.amount, path.tokens[0].decimals);
        const tokenOutAmount = formatUnits(path.outputAmount.amount, path.tokens[path.tokens.length - 1].decimals);

        const hops = [];
        let i = 0;
        for (const pool of path.pools) {
            if (pool.poolType !== 'Buffer') {
                hops.push({
                    tokenIn: `${path.tokens[i].address}`,
                    tokenOut: `${path.tokens[i + 1].address}`,
                    tokenInAmount: i === 0 ? tokenInAmount : '0',
                    tokenOutAmount: i === pools.length - 1 ? tokenOutAmount : '0',
                    poolId: pool.id,
                    pool: pools.find((p) => p.id === pool.id) as GqlPoolMinimal,
                });
            }
            i++;
        }

        return {
            tokenIn,
            tokenOut,
            tokenInAmount,
            tokenOutAmount,
            share: 0.5, // TODO needed?
            hops: hops,
        };
    }

    private mapSingleSwap(path: PathWithAmount, pool: GqlPoolMinimal): GqlSorSwapRoute {
        const tokenIn = path.tokens[0].address;
        const tokenInAmount = formatUnits(path.inputAmount.amount, path.tokens[0].decimals);
        const tokenOut = path.tokens[1].address;
        const tokenOutAmount = formatUnits(path.inputAmount.amount, path.tokens[1].decimals);

        const hop: GqlSorSwapRouteHop = {
            pool,
            poolId: pool.id,
            tokenIn,
            tokenInAmount,
            tokenOut,
            tokenOutAmount,
        };
        return {
            share: 1,
            tokenIn,
            tokenOut,
            tokenInAmount,
            tokenOutAmount,
            hops: [hop],
        } as GqlSorSwapRoute;
    }
}

export const sorV2Service = new SorPathService();
