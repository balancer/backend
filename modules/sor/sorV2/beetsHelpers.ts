import { BatchSwapStep, SingleSwap, SwapKind } from '@balancer/sdk';
import { GqlPoolMinimal, GqlSorSwapRoute, GqlSorSwapRouteHop } from '../../../schema';
import { formatFixed } from '@ethersproject/bignumber';

export function mapRoutes(
    swaps: BatchSwapStep[] | SingleSwap,
    amountIn: string,
    amountOut: string,
    pools: GqlPoolMinimal[],
    assetIn: string,
    assetOut: string,
    assets: string[],
    kind: SwapKind,
): GqlSorSwapRoute[] {
    const isBatchSwap = Array.isArray(swaps);
    if (!isBatchSwap) {
        const pool = pools.find((p) => p.id === swaps.poolId);
        if (!pool) throw new Error('Pool not found while mapping route');
        return [mapSingleSwap(swaps, amountIn, amountOut, pool)];
    }
    const paths = splitPaths(swaps, assetIn, assetOut, assets, kind);
    return paths.map((p) => mapBatchSwap(p, amountIn, amountOut, kind, assets, pools));
}

export function mapBatchSwap(
    swaps: BatchSwapStep[],
    amountIn: string,
    amountOut: string,
    kind: SwapKind,
    assets: string[],
    pools: GqlPoolMinimal[],
): GqlSorSwapRoute {
    const exactIn = kind === SwapKind.GivenIn;
    const first = swaps[0];
    const last = swaps[swaps.length - 1];
    let tokenInAmount: string;
    let tokenOutAmount: string;
    let share: bigint;
    const one = BigInt(1e18);
    if (exactIn) {
        tokenInAmount = first.amount.toString();
        share = (BigInt(tokenInAmount) * one) / BigInt(amountIn);
        tokenOutAmount = ((BigInt(amountOut) * share) / one).toString();
    } else {
        tokenOutAmount = last.amount.toString();
        share = (BigInt(tokenOutAmount) * one) / BigInt(amountOut);
        tokenInAmount = ((BigInt(amountIn) * share) / one).toString();
    }

    return {
        tokenIn: assets[Number(first.assetInIndex)],
        tokenOut: assets[Number(last.assetOutIndex)],
        tokenInAmount,
        tokenOutAmount,
        share: Number(formatFixed(share.toString(), 18)),
        hops: swaps.map((swap, i) => {
            return {
                tokenIn: assets[Number(swap.assetInIndex)],
                tokenOut: assets[Number(swap.assetOutIndex)],
                tokenInAmount: i === 0 ? tokenInAmount : '0',
                tokenOutAmount: i === swaps.length - 1 ? tokenOutAmount : '0',
                poolId: swap.poolId,
                pool: pools.find((p) => p.id === swap.poolId) as GqlPoolMinimal,
            };
        }),
    };
}

export function splitPaths(
    swaps: BatchSwapStep[],
    assetIn: string,
    assetOut: string,
    assets: string[],
    kind: SwapKind,
): BatchSwapStep[][] {
    const swapsCopy = [...swaps];
    if (kind === SwapKind.GivenOut) {
        swapsCopy.reverse();
    }
    const assetInIndex = BigInt(assets.indexOf(assetIn));
    const assetOutIndex = BigInt(assets.indexOf(assetOut));
    let path: BatchSwapStep[];
    let paths: BatchSwapStep[][] = [];
    swapsCopy.forEach((swap) => {
        if (swap.assetInIndex === assetInIndex && swap.assetOutIndex === assetOutIndex) {
            paths.push([swap]);
        } else if (swap.assetInIndex === assetInIndex) {
            path = [swap];
        } else if (swap.assetOutIndex === assetOutIndex) {
            path.push(swap);
            paths.push(path);
        } else {
            path.push(swap);
        }
    });
    return paths;
}

function mapSingleSwap(swap: SingleSwap, amountIn: string, amountOut: string, pool: GqlPoolMinimal): GqlSorSwapRoute {
    const hop: GqlSorSwapRouteHop = {
        pool,
        poolId: swap.poolId,
        tokenIn: swap.assetIn,
        tokenInAmount: amountIn,
        tokenOut: swap.assetOut,
        tokenOutAmount: amountOut,
    };
    return {
        share: 1,
        tokenIn: swap.assetIn,
        tokenOut: swap.assetOut,
        tokenInAmount: amountIn,
        tokenOutAmount: amountOut,
        hops: [hop],
    } as GqlSorSwapRoute;
}
