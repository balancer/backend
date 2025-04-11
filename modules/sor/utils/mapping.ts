import {
    GqlSorSwapType,
    GqlSorPath,
    GqlPoolMinimal,
    GqlSorSwapRoute,
    GqlSorSwapRouteHop,
    GqlSorGetSwapPaths,
    GqlSorCallData,
    QuerySorGetSwapPathsArgs,
} from '../../../apps/api/gql/generated-schema';
import { SwapKind, TokenAmount, BatchSwapStep, DEFAULT_USERDATA, SingleSwap } from '@balancer/sdk';
import { formatUnits } from 'viem';
import { PathWithAmount } from '../lib/path';
import { Chain } from '@prisma/client';
import { replaceZeroAddressWithEth } from '../../web3/addresses';
import { GqlSorSwap } from '../../../apps/api/gql/generated-schema';
import { poolService } from '../../pool/pool.service';
import { getInputAmount, getOutputAmount } from '../lib/utils/helpers';
import { GetSwapPathsInput } from '../types';
import { getTokenAmountHuman } from './helpers';
import config from '../../../config';

export async function mapToGetSwapPathsInput(
    args: QuerySorGetSwapPathsArgs,
): Promise<Omit<GetSwapPathsInput, 'protocolVersion'>> {
    const amountToken = args.swapType === 'EXACT_IN' ? args.tokenIn : args.tokenOut;
    const amount = await getTokenAmountHuman(amountToken, args.swapAmount, args.chain);
    const wethIsEth =
        args.tokenIn === config[args.chain].eth.address || args.tokenOut === config[args.chain].eth.address;

    return {
        chain: args.chain,
        swapAmount: amount,
        swapType: args.swapType,
        tokenIn: args.tokenIn,
        tokenOut: args.tokenOut,
        queryBatchSwap: args.queryBatchSwap ?? false,
        callDataInput: args.callDataInput
            ? {
                  receiver: args.callDataInput.receiver,
                  sender: args.callDataInput.sender,
                  slippagePercentage: args.callDataInput.slippagePercentage,
                  deadline: args.callDataInput.deadline,
                  wethIsEth,
              }
            : undefined,
        considerPoolsWithHooks: args.considerPoolsWithHooks ?? true,
        poolIds: args.poolIds ?? undefined,
    };
}

export async function mapToSorSwapPaths(
    paths: PathWithAmount[],
    swapType: GqlSorSwapType,
    chain: Chain,
    protocolVersion: number,
): Promise<GqlSorGetSwapPaths> {
    const swapKind = mapSwapKind(swapType);

    let inputAmount = getInputAmount(paths);
    let outputAmount = getOutputAmount(paths);

    // TODO: remove this once we fully deprecate queryBatchSwap, callDataInput and priceImpact
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

    const sorPaths: GqlSorPath[] = paths.map((path) => ({
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
    }));

    const returnAmount = swapKind === SwapKind.GivenIn ? outputAmount : inputAmount;
    const swapAmount = swapKind === SwapKind.GivenIn ? inputAmount : outputAmount;

    const effectivePrice = outputAmount.amount > 0 ? inputAmount.divDownFixed(outputAmount.scale18) : Infinity;
    const effectivePriceReversed = outputAmount.divDownFixed(inputAmount.scale18);

    return {
        protocolVersion,
        vaultVersion: protocolVersion,
        paths: sorPaths,
        swapType,
        swaps: mapSwaps(paths, swapKind),
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
                : formatUnits((effectivePrice as TokenAmount).amount, (effectivePrice as TokenAmount).token.decimals),
        effectivePriceReversed: formatUnits(effectivePriceReversed.amount, effectivePriceReversed.token.decimals),
        routes: mapRoutes(paths, pools),
        priceImpact: {
            priceImpact: priceImpact,
            error: priceImpactError,
        },
        callData,
    };
}

export function mapSwapKind(swapType: GqlSorSwapType): SwapKind {
    return swapType === 'EXACT_IN' ? SwapKind.GivenIn : SwapKind.GivenOut;
}

export function mapRoutes(paths: PathWithAmount[], pools: GqlPoolMinimal[]): GqlSorSwapRoute[] {
    const isBatchSwap = paths.length > 1 || paths[0].pools.length > 1;

    if (!isBatchSwap) {
        if (pools.length === 0) {
            const bufferPool = paths[0].pools.find((p) => p.poolType === 'Buffer');
            if (!bufferPool) return [];
            return [mapSingleSwap(paths[0], { id: bufferPool.id, address: bufferPool.address } as GqlPoolMinimal)];
        }
        const pool = pools.find((p) => p.id === paths[0].pools[0].id);
        if (!pool) throw new Error('Pool not found while mapping route');
        return [mapSingleSwap(paths[0], pool)];
    }
    return paths.map((path) => mapBatchSwap(path, pools));
}

function mapBatchSwap(path: PathWithAmount, pools: GqlPoolMinimal[]): GqlSorSwapRoute {
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
        share: 0.5,
        hops,
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
    };
}

export function mapSwaps(paths: PathWithAmount[], swapKind: SwapKind): GqlSorSwap[] {
    const swaps = getSwaps(paths, swapKind);
    const assets = [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))];

    if (Array.isArray(swaps)) {
        return swaps.map((swap) => ({
            ...swap,
            assetInIndex: Number(swap.assetInIndex.toString()),
            assetOutIndex: Number(swap.assetOutIndex.toString()),
            amount: swap.amount.toString(),
        }));
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

function getSwaps(paths: PathWithAmount[], swapKind: SwapKind): BatchSwapStep[] | SingleSwap {
    const isBatchSwap = paths.length > 1 || paths[0].pools.length > 1;
    const assets = [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))];

    if (isBatchSwap) {
        const swaps: BatchSwapStep[] = [];

        if (swapKind === SwapKind.GivenIn) {
            paths.forEach((p) => {
                p.pools.forEach((pool, i) => {
                    swaps.push({
                        poolId: pool.id,
                        assetInIndex: BigInt(assets.indexOf(p.tokens[i].address)),
                        assetOutIndex: BigInt(assets.indexOf(p.tokens[i + 1].address)),
                        amount: i === 0 ? p.inputAmount.amount : 0n,
                        userData: DEFAULT_USERDATA,
                    });
                });
            });
        } else {
            paths.forEach((p) => {
                // Vault expects given out swaps to be in reverse order
                const reversedPools = [...p.pools].reverse();
                const reversedTokens = [...p.tokens].reverse();
                reversedPools.forEach((pool, i) => {
                    swaps.push({
                        poolId: pool.id,
                        assetInIndex: BigInt(assets.indexOf(reversedTokens[i + 1].address)),
                        assetOutIndex: BigInt(assets.indexOf(reversedTokens[i].address)),
                        amount: i === 0 ? p.outputAmount.amount : 0n,
                        userData: DEFAULT_USERDATA,
                    });
                });
            });
        }
        return swaps;
    } else {
        const path = paths[0];
        const pool = path.pools[0];
        return {
            poolId: pool.id,
            kind: swapKind,
            assetIn: path.tokens[0].address,
            assetOut: path.tokens[1].address,
            amount: path.swapAmount.amount,
            userData: DEFAULT_USERDATA,
        } as SingleSwap;
    }
}
