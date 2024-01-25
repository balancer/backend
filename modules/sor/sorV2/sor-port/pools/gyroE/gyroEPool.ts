import { Hex, parseEther, parseUnits } from 'viem';

import { BasePool } from '../index';
import { Token } from '../../token';
import { TokenAmount, BigintIsh } from '../../tokenAmount';
import { RawGyroEPool } from '../../../data/types';
import { PoolType, SwapKind } from '../../../types';
import { MathSol, WAD, getPoolAddress } from '../../../utils';
import { balancesFromTokenInOut, virtualOffset0, virtualOffset1 } from './gyroEMathHelpers';
import { calcInGivenOut, calcOutGivenIn, calculateInvariantWithError } from './gyroEMath';
import { MathGyro, SWAP_LIMIT_FACTOR } from '../../../utils/gyroHelpers/math';
import { GyroEParams, Vector2, DerivedGyroEParams } from './types';

export class GyroEPoolToken extends TokenAmount {
    public readonly rate: bigint;
    public readonly index: number;

    public constructor(token: Token, amount: BigintIsh, rate: BigintIsh, index: number) {
        super(token, amount);
        this.rate = BigInt(rate);
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
        this.index = index;
    }

    public increase(amount: bigint): TokenAmount {
        this.amount = this.amount + amount;
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
        return this;
    }

    public decrease(amount: bigint): TokenAmount {
        this.amount = this.amount - amount;
        this.scale18 = (this.amount * this.scalar * this.rate) / WAD;
        return this;
    }
}

export class GyroEPool implements BasePool {
    public readonly chainId: number;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.GyroE;
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly tokens: GyroEPoolToken[];
    public readonly gyroEParams: GyroEParams;
    public readonly derivedGyroEParams: DerivedGyroEParams;

    private readonly tokenMap: Map<string, GyroEPoolToken>;

    static fromRawPool(chainId: number, pool: RawGyroEPool): GyroEPool {
        const poolTokens: GyroEPoolToken[] = [];

        for (const t of pool.tokens) {
            const token = new Token(chainId, t.address, t.decimals, t.symbol, t.name);
            const tokenAmount = TokenAmount.fromHumanAmount(token, t.balance);
            const tokenRate = pool.tokenRates ? parseEther(pool.tokenRates[t.index]) : WAD;

            poolTokens.push(new GyroEPoolToken(token, tokenAmount.amount, tokenRate, t.index));
        }

        const gyroEParams: GyroEParams = {
            alpha: parseEther(pool.alpha),
            beta: parseEther(pool.beta),
            c: parseEther(pool.c),
            s: parseEther(pool.s),
            lambda: parseEther(pool.lambda),
        };

        const derivedGyroEParams: DerivedGyroEParams = {
            tauAlpha: {
                x: parseUnits(pool.tauAlphaX, 38),
                y: parseUnits(pool.tauAlphaY, 38),
            },
            tauBeta: {
                x: parseUnits(pool.tauBetaX, 38),
                y: parseUnits(pool.tauBetaY, 38),
            },
            u: parseUnits(pool.u, 38),
            v: parseUnits(pool.v, 38),
            w: parseUnits(pool.w, 38),
            z: parseUnits(pool.z, 38),
            dSq: parseUnits(pool.dSq, 38),
        };

        return new GyroEPool(
            pool.id,
            pool.poolTypeVersion,
            parseEther(pool.swapFee),
            poolTokens,
            gyroEParams,
            derivedGyroEParams,
        );
    }

    constructor(
        id: Hex,
        poolTypeVersion: number,
        swapFee: bigint,
        tokens: GyroEPoolToken[],
        gyroEParams: GyroEParams,
        derivedGyroEParams: DerivedGyroEParams,
    ) {
        this.chainId = tokens[0].token.chain;
        this.id = id;
        this.poolTypeVersion = poolTypeVersion;
        this.swapFee = swapFee;
        this.address = getPoolAddress(id);
        this.tokens = tokens;
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
        this.gyroEParams = gyroEParams;
        this.derivedGyroEParams = derivedGyroEParams;
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
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);
        const orderedNormalizedBalances = balancesFromTokenInOut(tIn.scale18, tOut.scale18, tIn.index === 0);
        const [currentInvariant, invErr] = calculateInvariantWithError(
            orderedNormalizedBalances,
            this.gyroEParams,
            this.derivedGyroEParams,
        );

        const invariant: Vector2 = {
            x: currentInvariant + invErr * 2n,
            y: currentInvariant,
        };
        const inAmount = GyroEPoolToken.fromRawAmount(tokenIn, swapAmount.amount);
        const inAmountLessFee = this.subtractSwapFeeAmount(inAmount);
        const inAmountWithRate = inAmountLessFee.mulDownFixed(tIn.rate);
        const outAmountScale18 = calcOutGivenIn(
            orderedNormalizedBalances,
            inAmountWithRate.scale18,
            tIn.index === 0,
            this.gyroEParams,
            this.derivedGyroEParams,
            invariant,
        );

        const outAmountWithRate = TokenAmount.fromScale18Amount(tokenOut, outAmountScale18);

        const outAmount = outAmountWithRate.divDownFixed(tOut.rate);

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
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);
        const orderedNormalizedBalances = balancesFromTokenInOut(tIn.scale18, tOut.scale18, tIn.index === 0);
        const [currentInvariant, invErr] = calculateInvariantWithError(
            orderedNormalizedBalances,
            this.gyroEParams,
            this.derivedGyroEParams,
        );
        const invariant: Vector2 = {
            x: currentInvariant + invErr * 2n,
            y: currentInvariant,
        };

        const inAmountLessFee = calcInGivenOut(
            orderedNormalizedBalances,
            swapAmount.scale18,
            tIn.index === 0,
            this.gyroEParams,
            this.derivedGyroEParams,
            invariant,
        );

        const inAmount = this.addSwapFeeAmount(GyroEPoolToken.fromScale18Amount(tokenIn, inAmountLessFee));

        const inAmountWithRate = inAmount.divUpFixed(tIn.rate);

        if (mutateBalances) {
            tIn.decrease(inAmountWithRate.amount);
            tOut.increase(swapAmount.amount);
        }

        return inAmountWithRate;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);
        if (swapKind === SwapKind.GivenIn) {
            const orderedNormalizedBalances = balancesFromTokenInOut(tIn.scale18, tOut.scale18, tIn.index === 0);
            const [currentInvariant, invErr] = calculateInvariantWithError(
                orderedNormalizedBalances,
                this.gyroEParams,
                this.derivedGyroEParams,
            );
            const invariant: Vector2 = {
                x: currentInvariant + invErr * 2n,
                y: currentInvariant,
            };
            const virtualOffsetFunc = tIn.index === 0 ? virtualOffset0 : virtualOffset1;
            const maxAmountInAssetInPool =
                virtualOffsetFunc(this.gyroEParams, this.derivedGyroEParams, invariant) -
                virtualOffsetFunc(this.gyroEParams, this.derivedGyroEParams, invariant, true);
            const limitAmountIn = MathGyro.divDown(maxAmountInAssetInPool - tIn.scale18, tIn.rate);
            const limitAmountInPlusSwapFee = MathGyro.divDown(limitAmountIn, WAD - this.swapFee);
            return MathGyro.mulDown(limitAmountInPlusSwapFee, SWAP_LIMIT_FACTOR);
        }
        return MathGyro.mulDown(tOut.amount, SWAP_LIMIT_FACTOR);
    }

    public subtractSwapFeeAmount(amount: TokenAmount): TokenAmount {
        const feeAmount = amount.mulUpFixed(this.swapFee);
        return amount.sub(feeAmount);
    }

    public addSwapFeeAmount(amount: TokenAmount): TokenAmount {
        return amount.divUpFixed(MathSol.complementFixed(this.swapFee));
    }

    getRequiredTokenPair(
        tokenIn: Token,
        tokenOut: Token,
    ): {
        tIn: GyroEPoolToken;
        tOut: GyroEPoolToken;
    } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
