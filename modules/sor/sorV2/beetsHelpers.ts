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
