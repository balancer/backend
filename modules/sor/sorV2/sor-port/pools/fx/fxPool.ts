import { Hex, parseEther, parseUnits } from 'viem';
import { PoolType, SwapKind } from '../../../types';
import { Token } from '../../token';
import { TokenAmount } from '../../tokenAmount';
import { BasePool } from '..';
import { RAY, getPoolAddress } from '../../../utils';
import { _calcInGivenOut, _calcOutGivenIn } from './fxMath';
import { RawFxPool } from '../../../data/types';
import { MathFx, parseFixedCurveParam } from './helpers';
import { FxPoolPairData } from './types';
import { FxPoolToken } from './fxPoolToken';

const isUSDC = (address: string): boolean => {
    return (
        address.toLowerCase() === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' ||
        address.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    );
};

export class FxPool implements BasePool {
    public readonly chainId: number;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.Fx;
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly alpha: bigint;
    public readonly beta: bigint;
    public readonly lambda: bigint;
    public readonly delta: bigint;
    public readonly epsilon: bigint;
    public readonly tokens: FxPoolToken[];

    private readonly tokenMap: Map<string, FxPoolToken>;

    static fromRawPool(chainId: number, pool: RawFxPool): FxPool {
        const poolTokens: FxPoolToken[] = [];

        for (const t of pool.tokens) {
            if (!t.token.latestFXPrice) {
                throw new Error('FX pool token does not have latestFXPrice');
            }

            const token = new Token(chainId, t.address, t.decimals, t.symbol, t.name);
            const tokenAmount = TokenAmount.fromHumanAmount(token, t.balance);

            poolTokens.push(
                new FxPoolToken(
                    token,
                    tokenAmount.amount,
                    t.token.latestFXPrice,
                    t.token.fxOracleDecimals || 8,
                    t.index,
                ),
            );
        }

        return new FxPool(
            pool.id,
            pool.poolTypeVersion,
            parseEther(pool.swapFee),
            parseFixedCurveParam(pool.alpha),
            parseFixedCurveParam(pool.beta),
            parseFixedCurveParam(pool.lambda),
            parseUnits(pool.delta, 36),
            parseFixedCurveParam(pool.epsilon),
            poolTokens,
        );
    }

    constructor(
        id: Hex,
        poolTypeVersion: number,
        swapFee: bigint,
        alpha: bigint,
        beta: bigint,
        lambda: bigint,
        delta: bigint,
        epsilon: bigint,
        tokens: FxPoolToken[],
    ) {
        this.chainId = tokens[0].token.chain;
        this.id = id;
        this.poolTypeVersion = poolTypeVersion;
        this.swapFee = swapFee;
        this.alpha = alpha;
        this.beta = beta;
        this.lambda = lambda;
        this.delta = delta;
        this.epsilon = epsilon;
        this.address = getPoolAddress(id);
        this.tokens = tokens;
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');
        // TODO: Fix fx normalized liquidity calc
        return tOut.amount;
    }

    public swapGivenIn(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const poolPairData = this.getPoolPairData(tokenIn, tokenOut, swapAmount.amount, SwapKind.GivenIn);
        if (poolPairData.tIn === poolPairData.tOut) return poolPairData.tIn;

        const amountOutNumeraire = _calcOutGivenIn(poolPairData);

        const amountOutNumeraireLessFee = MathFx.mulDownFixed(amountOutNumeraire, RAY - this.epsilon);

        const fxAmountOut = FxPoolToken.fromNumeraire(poolPairData.tOut, amountOutNumeraireLessFee);

        const amountOut = TokenAmount.fromRawAmount(fxAmountOut.token, fxAmountOut.amount);

        if (mutateBalances) {
            poolPairData.tIn.increase(swapAmount.amount);
            poolPairData.tOut.decrease(amountOut.amount);
        }

        return amountOut;
    }

    public swapGivenOut(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const poolPairData = this.getPoolPairData(tokenIn, tokenOut, swapAmount.amount, SwapKind.GivenOut);
        if (poolPairData.tIn === poolPairData.tOut) return poolPairData.tOut;

        const amountInNumeraire = _calcInGivenOut(poolPairData);

        const amountInNumeraireWithFee = MathFx.mulDownFixed(amountInNumeraire, RAY + this.epsilon);

        const fxAmountIn = FxPoolToken.fromNumeraire(poolPairData.tIn, amountInNumeraireWithFee);

        const amountIn = TokenAmount.fromRawAmount(fxAmountIn.token, fxAmountIn.amount);

        if (mutateBalances) {
            poolPairData.tIn.decrease(amountIn.amount);
            poolPairData.tOut.increase(swapAmount.amount);
        }

        return amountIn;
    }

    /**
     * Fx pool logic has an alpha region where it halts swaps.
     * maxLimit  = [(1 + alpha) * oGLiq * 0.5] - token liquidity
     */
    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { _oGLiq, tIn, tOut } = this.getPoolPairData(tokenIn, tokenOut, 0n, swapKind);
        const maxLimit = MathFx.mulDownFixed(this.alpha + RAY, _oGLiq) / 2n; // TODO: double check if RAY is indeed 1e36 or 1e27 - google says it's 1e27
        if (swapKind === SwapKind.GivenIn) {
            const maxAmount = maxLimit - tIn.numeraire;
            return FxPoolToken.fromNumeraire(tIn, maxAmount).amount;
        }
        const maxAmount = maxLimit - tOut.numeraire;
        return FxPoolToken.fromNumeraire(tOut, maxAmount).amount;
    }

    public getPoolPairData(tokenIn: Token, tokenOut: Token, swapAmount: bigint, swapKind: SwapKind): FxPoolPairData {
        const tIn = this.tokenMap.get(tokenIn.address);
        const tOut = this.tokenMap.get(tokenOut.address);

        if (!tIn || !tOut) {
            throw new Error('Token not found');
        }

        const usdcToken = isUSDC(tokenIn.address) ? tIn : tOut;
        const baseToken = isUSDC(tokenIn.address) ? tOut : tIn;

        const givenToken =
            swapKind === SwapKind.GivenIn
                ? new FxPoolToken(tIn.token, swapAmount, tIn.latestFXPrice, tIn.fxOracleDecimals, tIn.index)
                : new FxPoolToken(tOut.token, swapAmount, tOut.latestFXPrice, tOut.fxOracleDecimals, tOut.index);

        return {
            tIn,
            tOut,
            alpha: this.alpha,
            beta: this.beta,
            delta: this.delta,
            lambda: this.lambda,
            _oGLiq: baseToken.numeraire + usdcToken.numeraire,
            _nGLiq: baseToken.numeraire + usdcToken.numeraire,
            _oBals: [usdcToken.numeraire, baseToken.numeraire],
            _nBals: isUSDC(tokenIn.address)
                ? [usdcToken.numeraire + givenToken.numeraire, baseToken.numeraire - givenToken.numeraire]
                : [usdcToken.numeraire - givenToken.numeraire, baseToken.numeraire + givenToken.numeraire],
            givenToken,
            swapKind,
        };
    }
}
