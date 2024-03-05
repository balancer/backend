import {
    BatchSwapStep,
    BigintIsh,
    DEFAULT_USERDATA,
    PriceImpactAmount,
    SingleSwap,
    SwapKind,
    Token,
    TokenAmount,
} from '@balancer/sdk';
import { PathWithAmount } from '../path';
import { MathSol, abs } from './math';

export function checkInputs(
    tokenIn: Token,
    tokenOut: Token,
    swapKind: SwapKind,
    swapAmount: BigintIsh | TokenAmount,
): TokenAmount {
    let amount: TokenAmount;

    if (swapAmount instanceof TokenAmount) {
        amount = swapAmount;
    } else {
        amount = TokenAmount.fromRawAmount(swapKind === SwapKind.GivenIn ? tokenIn : tokenOut, swapAmount);
    }

    if (
        (swapKind === SwapKind.GivenIn && !tokenIn.isEqual(amount.token)) ||
        (swapKind === SwapKind.GivenOut && !tokenOut.isEqual(amount.token))
    ) {
        throw new Error('Swap amount token does not match input token');
    }

    return amount;
}

export function calculatePriceImpact(paths: PathWithAmount[], swapKind: SwapKind): PriceImpactAmount {
    const pathsReverse = paths.map(
        (path) =>
            new PathWithAmount(
                [...path.tokens].reverse(),
                [...path.pools].reverse(),
                swapKind === SwapKind.GivenIn ? path.outputAmount : path.inputAmount,
            ),
    );

    const amountInitial = swapKind === SwapKind.GivenIn ? getInputAmount(paths).amount : getOutputAmount(paths).amount;

    const amountFinal =
        swapKind === SwapKind.GivenIn ? getOutputAmount(pathsReverse).amount : getInputAmount(pathsReverse).amount;

    const priceImpact = MathSol.divDownFixed(abs(amountInitial - amountFinal), amountInitial * 2n);
    return PriceImpactAmount.fromRawAmount(priceImpact);
}

export function getInputAmount(paths: PathWithAmount[]): TokenAmount {
    if (!paths.every((p) => p.inputAmount.token.isEqual(paths[0].inputAmount.token))) {
        throw new Error('Input amount can only be calculated if all paths have the same input token');
    }
    const amounts = paths.map((path) => path.inputAmount);
    return amounts.reduce((a, b) => a.add(b));
}

export function getOutputAmount(paths: PathWithAmount[]): TokenAmount {
    if (!paths.every((p) => p.outputAmount.token.isEqual(paths[0].outputAmount.token))) {
        throw new Error('Output amount can only be calculated if all paths have the same output token');
    }
    const amounts = paths.map((path) => path.outputAmount);
    return amounts.reduce((a, b) => a.add(b));
}

export function getSwaps(paths: PathWithAmount[], swapKind: SwapKind) {
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
