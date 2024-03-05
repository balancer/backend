import { BatchSwapStep, SingleSwap, SwapKind, ZERO_ADDRESS } from '@balancer/sdk';
import { GqlPoolMinimal, GqlSorSwapRoute, GqlSorSwapRouteHop } from '../../../schema';
import { PathWithAmount } from './lib/path';
import { formatUnits } from 'viem';
import { formatFixed } from '@ethersproject/bignumber';

export function mapRoutes(paths: PathWithAmount[], pools: GqlPoolMinimal[]): GqlSorSwapRoute[] {
    const isBatchSwap = paths.length > 1 || paths[0].pools.length > 1;

    if (!isBatchSwap) {
        const pool = pools.find((p) => p.id === paths[0].pools[0].id);
        if (!pool) throw new Error('Pool not found while mapping route');
        return [mapSingleSwap(paths[0], pool)];
    }
    return paths.map((path) => mapBatchSwap(path, pools));
}

export function mapBatchSwap(path: PathWithAmount, pools: GqlPoolMinimal[]): GqlSorSwapRoute {
    const tokenIn = path.tokens[0].address;
    const tokenOut = path.tokens[path.tokens.length - 1].address;
    const tokenInAmount = formatUnits(path.inputAmount.amount, path.tokens[0].decimals);
    const tokenOutAmount = formatUnits(path.inputAmount.amount, path.tokens[path.tokens.length - 1].decimals);

    return {
        tokenIn,
        tokenOut,
        tokenInAmount,
        tokenOutAmount,
        share: 0, // TODO needed?
        hops: path.pools.map((pool, i) => {
            return {
                tokenIn: `${path.tokens[i].address}`,
                tokenOut: `${path.tokens[i + 1]}`,
                tokenInAmount: i === 0 ? tokenInAmount : '0',
                tokenOutAmount: i === pools.length - 1 ? tokenOutAmount : '0',
                poolId: pool.id,
                pool: pools.find((p) => p.id === pool.id) as GqlPoolMinimal,
            };
        }),
    };
}

function mapSingleSwap(path: PathWithAmount, pool: GqlPoolMinimal): GqlSorSwapRoute {
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

export function mapRoutesOld(
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
        return [mapSingleSwapOld(swaps, amountIn, amountOut, pool)];
    }
    const paths = splitPaths(swaps, assetIn, assetOut, assets, kind);
    return paths.map((p) => mapBatchSwapOld(p, amountIn, amountOut, kind, assets, pools));
}

export function mapBatchSwapOld(
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
    // const assetInIndex = BigInt(assets.indexOf(assetIn === NATIVE_ADDRESS ? ZERO_ADDRESS : assetIn));
    // const assetOutIndex = BigInt(assets.indexOf(assetOut === NATIVE_ADDRESS ? ZERO_ADDRESS : assetOut));
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

function mapSingleSwapOld(
    swap: SingleSwap,
    amountIn: string,
    amountOut: string,
    pool: GqlPoolMinimal,
): GqlSorSwapRoute {
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
