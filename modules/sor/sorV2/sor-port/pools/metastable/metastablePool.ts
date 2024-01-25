import { Hex, parseEther } from 'viem';
import { PoolType, SwapKind } from '../../../types';
import { Token, TokenAmount } from '../..';
import { BasePool } from '..';
import { getPoolAddress, MathSol, WAD } from '../../../utils';
import { _calcInGivenOut, _calcOutGivenIn, _calculateInvariant } from '../stable/stableMath';
import { StablePoolToken } from '../stable/stablePool';
import { RawMetaStablePool } from '../../../data/types';

export class MetaStablePool implements BasePool {
    public readonly chainId: number;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.MetaStable;
    public readonly amp: bigint;
    public readonly swapFee: bigint;
    public readonly tokens: StablePoolToken[];

    private readonly tokenMap: Map<string, StablePoolToken>;
    private readonly tokenIndexMap: Map<string, number>;

    static fromRawPool(chainId: number, pool: RawMetaStablePool): MetaStablePool {
        const poolTokens: StablePoolToken[] = [];

        for (const t of pool.tokens) {
            if (!t.priceRate) throw new Error('Meta Stable pool token does not have a price rate');
            const token = new Token(chainId, t.address, t.decimals, t.symbol, t.name);
            const tokenAmount = TokenAmount.fromHumanAmount(token, t.balance);

            const tokenIndex = t.index ?? pool.tokensList.findIndex((t) => t === token.address);

            poolTokens.push(new StablePoolToken(token, tokenAmount.amount, parseEther(t.priceRate), tokenIndex));
        }

        const amp = BigInt(pool.amp) * 1000n;

        return new MetaStablePool(pool.id, amp, parseEther(pool.swapFee), poolTokens);
    }

    constructor(id: Hex, amp: bigint, swapFee: bigint, tokens: StablePoolToken[]) {
        this.chainId = tokens[0].token.chain;
        this.id = id;
        this.address = getPoolAddress(id);
        this.amp = amp;
        this.swapFee = swapFee;

        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
        this.tokenIndexMap = new Map(this.tokens.map((token) => [token.token.address, token.index]));
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.address);
        const tOut = this.tokenMap.get(tokenOut.address);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');
        // TODO: Fix stable normalized liquidity calc
        return tOut.amount * this.amp;
    }

    public swapGivenIn(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const tInIndex = this.tokenIndexMap.get(tokenIn.address);
        const tOutIndex = this.tokenIndexMap.get(tokenOut.address);

        if (typeof tInIndex !== 'number' || typeof tOutIndex !== 'number') {
            throw new Error('Pool does not contain the tokens provided');
        }

        if (swapAmount.amount > this.tokens[tInIndex].amount) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        const amountInWithFee = this.subtractSwapFeeAmount(swapAmount);
        const amountInWithRate = amountInWithFee.mulDownFixed(this.tokens[tInIndex].rate);
        const balances = this.tokens.map((t) => t.scale18);

        const invariant = _calculateInvariant(this.amp, [...balances], true);

        const tokenOutScale18 = _calcOutGivenIn(
            this.amp,
            [...balances],
            tInIndex,
            tOutIndex,
            amountInWithRate.scale18,
            invariant,
        );

        const amountOut = TokenAmount.fromScale18Amount(tokenOut, tokenOutScale18);
        const amountOutWithRate = amountOut.divDownFixed(this.tokens[tOutIndex].rate);

        if (amountOutWithRate.amount < 0n) throw new Error('Swap output negative');

        if (mutateBalances) {
            this.tokens[tInIndex].increase(swapAmount.amount);
            this.tokens[tOutIndex].decrease(amountOutWithRate.amount);
        }

        return amountOutWithRate;
    }

    public swapGivenOut(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const tInIndex = this.tokenIndexMap.get(tokenIn.address);
        const tOutIndex = this.tokenIndexMap.get(tokenOut.address);

        if (typeof tInIndex !== 'number' || typeof tOutIndex !== 'number') {
            throw new Error('Pool does not contain the tokens provided');
        }

        if (swapAmount.amount > this.tokens[tOutIndex].amount) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        const amountOutWithRate = swapAmount.mulDownFixed(this.tokens[tOutIndex].rate);

        const balances = this.tokens.map((t) => t.scale18);

        const invariant = _calculateInvariant(this.amp, balances, true);

        const tokenInScale18 = _calcInGivenOut(
            this.amp,
            [...balances],
            tInIndex,
            tOutIndex,
            amountOutWithRate.scale18,
            invariant,
        );

        const amountIn = TokenAmount.fromScale18Amount(tokenIn, tokenInScale18, true);
        const amountInWithFee = this.addSwapFeeAmount(amountIn);
        const amountInWithRate = amountInWithFee.divDownFixed(this.tokens[tInIndex].rate);

        if (amountInWithRate.amount < 0n) throw new Error('Swap output negative');

        if (mutateBalances) {
            this.tokens[tInIndex].increase(amountInWithRate.amount);
            this.tokens[tOutIndex].decrease(swapAmount.amount);
        }

        return amountInWithRate;
    }

    public subtractSwapFeeAmount(amount: TokenAmount): TokenAmount {
        const feeAmount = amount.mulUpFixed(this.swapFee);
        return amount.sub(feeAmount);
    }

    public addSwapFeeAmount(amount: TokenAmount): TokenAmount {
        return amount.divUpFixed(MathSol.complementFixed(this.swapFee));
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const tIn = this.tokenMap.get(tokenIn.address);
        const tOut = this.tokenMap.get(tokenOut.address);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');

        if (swapKind === SwapKind.GivenIn) {
            // Return max valid amount of tokenIn
            // As an approx - use almost the total balance of token out as we can add any amount of tokenIn and expect some back
            return (tIn.amount * WAD) / tIn.rate;
        }
        // Return max amount of tokenOut - approx is almost all balance
        return (tOut.amount * WAD) / tOut.rate;
    }
}
