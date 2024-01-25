import { Hex, parseEther } from 'viem';

import { _calcInGivenOut, _calcOutGivenIn, _calculateInvariant, _findVirtualParams } from './gyro2Math';
import { BasePool } from '..';
import { Token } from '../../token';
import { TokenAmount, BigintIsh } from '../../tokenAmount';
import { RawGyro2Pool } from '../../../data/types';
import { PoolType, SwapKind } from '../../../types';
import { getPoolAddress, MathSol, WAD } from '../../../utils';
import { SWAP_LIMIT_FACTOR } from '../../../utils/gyroHelpers/math';

export class Gyro2PoolToken extends TokenAmount {
    public readonly index: number;

    public constructor(token: Token, amount: BigintIsh, index: number) {
        super(token, amount);
        this.index = index;
    }

    public increase(amount: bigint): TokenAmount {
        this.amount = this.amount + amount;
        this.scale18 = this.amount * this.scalar;
        return this;
    }

    public decrease(amount: bigint): TokenAmount {
        this.amount = this.amount - amount;
        this.scale18 = this.amount * this.scalar;
        return this;
    }
}

export class Gyro2Pool implements BasePool {
    public readonly chainId: number;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.Gyro2;
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly tokens: Gyro2PoolToken[];

    private readonly sqrtAlpha: bigint;
    private readonly sqrtBeta: bigint;
    private readonly tokenMap: Map<string, Gyro2PoolToken>;

    static fromRawPool(chainId: number, pool: RawGyro2Pool): Gyro2Pool {
        const poolTokens: Gyro2PoolToken[] = [];

        for (const t of pool.tokens) {
            const token = new Token(chainId, t.address, t.decimals, t.symbol, t.name);
            const tokenAmount = TokenAmount.fromHumanAmount(token, t.balance);

            poolTokens.push(new Gyro2PoolToken(token, tokenAmount.amount, t.index));
        }

        return new Gyro2Pool(
            pool.id,
            pool.poolTypeVersion,
            parseEther(pool.swapFee),
            parseEther(pool.sqrtAlpha),
            parseEther(pool.sqrtBeta),
            poolTokens,
        );
    }

    constructor(
        id: Hex,
        poolTypeVersion: number,
        swapFee: bigint,
        sqrtAlpha: bigint,
        sqrtBeta: bigint,
        tokens: Gyro2PoolToken[],
    ) {
        this.chainId = tokens[0].token.chain;
        this.id = id;
        this.poolTypeVersion = poolTypeVersion;
        this.swapFee = swapFee;
        this.sqrtAlpha = sqrtAlpha;
        this.sqrtBeta = sqrtBeta;
        this.address = getPoolAddress(id);
        this.tokens = tokens;
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');
        // TODO: Fix gyro normalized liquidity calc
        return tOut.amount;
    }

    public swapGivenIn(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const { tIn, tOut, sqrtAlpha, sqrtBeta } = this.getPoolPairData(tokenIn, tokenOut);
        const invariant = _calculateInvariant([tIn.scale18, tOut.scale18], sqrtAlpha, sqrtBeta);
        const [virtualParamIn, virtualParamOut] = _findVirtualParams(invariant, sqrtAlpha, sqrtBeta);
        const inAmountLessFee = this.subtractSwapFeeAmount(swapAmount);

        const outAmountScale18 = _calcOutGivenIn(
            tIn.scale18,
            tOut.scale18,
            inAmountLessFee.scale18,
            virtualParamIn,
            virtualParamOut,
        );

        if (outAmountScale18 > tOut.scale18) throw new Error('ASSET_BOUNDS_EXCEEDED');

        const outAmount = TokenAmount.fromScale18Amount(tokenOut, outAmountScale18);

        if (mutateBalances) {
            tIn.increase(swapAmount.amount);
            tOut.decrease(outAmount.amount);
        }

        return outAmount;
    }

    public swapGivenOut(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const { tIn, tOut, sqrtAlpha, sqrtBeta } = this.getPoolPairData(tokenIn, tokenOut);

        if (swapAmount.scale18 > tOut.scale18) throw new Error('ASSET_BOUNDS_EXCEEDED');

        const invariant = _calculateInvariant([tIn.scale18, tOut.scale18], sqrtAlpha, sqrtBeta);
        const [virtualParamIn, virtualParamOut] = _findVirtualParams(invariant, sqrtAlpha, sqrtBeta);
        const inAmountLessFee = _calcInGivenOut(
            tIn.scale18,
            tOut.scale18,
            swapAmount.scale18,
            virtualParamIn,
            virtualParamOut,
        );
        const inAmount = this.addSwapFeeAmount(TokenAmount.fromScale18Amount(tokenIn, inAmountLessFee));

        if (mutateBalances) {
            tIn.decrease(inAmount.amount);
            tOut.increase(swapAmount.amount);
        }

        return inAmount;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut, sqrtAlpha, sqrtBeta } = this.getPoolPairData(tokenIn, tokenOut);
        if (swapKind === SwapKind.GivenIn) {
            const invariant = _calculateInvariant([tIn.scale18, tOut.scale18], sqrtAlpha, sqrtBeta);
            const maxAmountInAssetInPool = MathSol.mulUpFixed(
                invariant,
                MathSol.divDownFixed(WAD, sqrtAlpha) - MathSol.divDownFixed(WAD, sqrtBeta),
            ); // x+ = L * (1/sqrtAlpha - 1/sqrtBeta)
            const limitAmountIn = maxAmountInAssetInPool - tIn.scale18;
            const limitAmountInPlusSwapFee = MathSol.divDownFixed(limitAmountIn, WAD - this.swapFee);
            return MathSol.mulDownFixed(limitAmountInPlusSwapFee, SWAP_LIMIT_FACTOR);
        }
        return MathSol.mulDownFixed(tOut.amount, SWAP_LIMIT_FACTOR);
    }

    public subtractSwapFeeAmount(amount: TokenAmount): TokenAmount {
        const feeAmount = amount.mulUpFixed(this.swapFee);
        return amount.sub(feeAmount);
    }

    public addSwapFeeAmount(amount: TokenAmount): TokenAmount {
        return amount.divUpFixed(MathSol.complementFixed(this.swapFee));
    }

    public getPoolPairData(
        tokenIn: Token,
        tokenOut: Token,
    ): {
        tIn: Gyro2PoolToken;
        tOut: Gyro2PoolToken;
        sqrtAlpha: bigint;
        sqrtBeta: bigint;
    } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        const sqrtAlpha = tIn.index === 0 ? this.sqrtAlpha : MathSol.divDownFixed(WAD, this.sqrtBeta);
        const sqrtBeta = tIn.index === 0 ? this.sqrtBeta : MathSol.divDownFixed(WAD, this.sqrtAlpha);

        return { tIn, tOut, sqrtAlpha, sqrtBeta };
    }
}
