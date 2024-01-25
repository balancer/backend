import { Token } from '../token';
import { TokenAmount, BigintIsh } from '../tokenAmount';
import { PrismaPoolWithDynamic } from '../../../../../prisma/prisma-types';
import { parseUnits } from 'ethers/lib/utils';
import { GqlPoolType } from '../../../../../schema';
import { Chain } from '@prisma/client';
import { BasePool, SwapKind } from '../types';
import { MathSol, WAD } from '../utils/math';

class WeightedPoolToken extends TokenAmount {
    public readonly weight: bigint;
    public readonly index: number;

    public constructor(token: Token, amount: BigintIsh, weight: BigintIsh, index: number) {
        super(token, amount);
        this.weight = BigInt(weight);
        this.index = index;
    }
}

export class WeightedPool implements BasePool {
    public readonly chain: Chain;
    public readonly id: string;
    public readonly address: string;
    public readonly poolType: GqlPoolType = 'WEIGHTED';
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly tokens: WeightedPoolToken[];

    private readonly tokenMap: Map<string, WeightedPoolToken>;
    private readonly MAX_IN_RATIO = 300000000000000000n; // 0.3
    private readonly MAX_OUT_RATIO = 300000000000000000n; // 0.3

    static fromPrismaPool(pool: PrismaPoolWithDynamic): WeightedPool {
        const poolTokens: WeightedPoolToken[] = [];

        if (!pool.dynamicData) {
            throw new Error('No dynamic data for pool');
        }

        for (const poolToken of pool.tokens) {
            if (!poolToken.dynamicData?.weight) {
                throw new Error('Weighted pool token does not have a weight');
            }

            const token = new Token(
                pool.chain,
                poolToken.address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const tokenAmount = TokenAmount.fromHumanAmount(token, poolToken.dynamicData.balance);

            poolTokens.push(
                new WeightedPoolToken(
                    token,
                    tokenAmount.amount,
                    parseUnits(poolToken.dynamicData.weight, 18).toBigInt(),
                    poolToken.index,
                ),
            );
        }

        return new WeightedPool(
            pool.id,
            pool.address,
            pool.chain,
            pool.version,
            parseUnits(pool.dynamicData.swapFee, 18).toBigInt(),
            poolTokens,
        );
    }

    constructor(
        id: string,
        address: string,
        chain: Chain,
        poolTypeVersion: number,
        swapFee: bigint,
        tokens: WeightedPoolToken[],
    ) {
        this.chain = chain;
        this.id = id;
        this.poolTypeVersion = poolTypeVersion;
        this.address = address;
        this.swapFee = swapFee;
        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        return (tIn.amount * tOut.weight) / (tIn.weight + tOut.weight);
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        if (swapKind === SwapKind.GivenIn) {
            return (tIn.amount * this.MAX_IN_RATIO) / WAD;
        }
        return (tOut.amount * this.MAX_OUT_RATIO) / WAD;
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        if (swapAmount.amount > this.getLimitAmountSwap(tokenIn, tokenOut, SwapKind.GivenIn)) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        const amountWithFee = this.subtractSwapFeeAmount(swapAmount);

        const tokenOutScale18 = this._calcOutGivenIn(
            tIn.scale18,
            tIn.weight,
            tOut.scale18,
            tOut.weight,
            amountWithFee.scale18,
            this.poolTypeVersion,
        );

        const tokenOutAmount = TokenAmount.fromScale18Amount(tokenOut, tokenOutScale18);

        return tokenOutAmount;
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        if (swapAmount.amount > this.getLimitAmountSwap(tokenIn, tokenOut, SwapKind.GivenOut)) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        const tokenInScale18 = this._calcInGivenOut(
            tIn.scale18,
            tIn.weight,
            tOut.scale18,
            tOut.weight,
            swapAmount.scale18,
            this.poolTypeVersion,
        );

        const tokenInAmount = this.addSwapFeeAmount(TokenAmount.fromScale18Amount(tokenIn, tokenInScale18, true));

        return tokenInAmount;
    }

    public subtractSwapFeeAmount(amount: TokenAmount): TokenAmount {
        const feeAmount = amount.mulUpFixed(this.swapFee);
        return amount.sub(feeAmount);
    }

    public addSwapFeeAmount(amount: TokenAmount): TokenAmount {
        return amount.divUpFixed(MathSol.complementFixed(this.swapFee));
    }

    private getRequiredTokenPair(tokenIn: Token, tokenOut: Token): { tIn: WeightedPoolToken; tOut: WeightedPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }

    private _calcOutGivenIn(
        balanceIn: bigint,
        weightIn: bigint,
        balanceOut: bigint,
        weightOut: bigint,
        amountIn: bigint,
        version?: number,
    ): bigint {
        const denominator = balanceIn + amountIn;
        const base = MathSol.divUpFixed(balanceIn, denominator);
        const exponent = MathSol.divDownFixed(weightIn, weightOut);
        const power = MathSol.powUpFixed(base, exponent, version);
        return MathSol.mulDownFixed(balanceOut, MathSol.complementFixed(power));
    }

    private _calcInGivenOut(
        balanceIn: bigint,
        weightIn: bigint,
        balanceOut: bigint,
        weightOut: bigint,
        amountOut: bigint,
        version?: number,
    ): bigint {
        const base = MathSol.divUpFixed(balanceOut, balanceOut - amountOut);
        const exponent = MathSol.divUpFixed(weightOut, weightIn);
        const power = MathSol.powUpFixed(base, exponent, version);
        const ratio = power - WAD;
        return MathSol.mulUpFixed(balanceIn, ratio);
    }
}
