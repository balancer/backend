import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { GqlPoolType } from '../../../../../../schema';
import { Chain } from '@prisma/client';
import { MathSol, WAD } from '../../utils/math';
import { Address, Hex, parseEther } from 'viem';
import { BigintIsh, RemoveLiquidityKind, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { chainToIdMap } from '../../../../../network/network-config';
import { TokenPairData } from '../../../../../pool/lib/pool-on-chain-tokenpair-data';
import { BasePool } from '../basePool';

export class WeightedPoolToken extends TokenAmount {
    public readonly weight: bigint;
    public readonly index: number;

    public constructor(token: Token, amount: BigintIsh, weight: BigintIsh, index: number) {
        super(token, amount);
        //TODO: V3 Pool weights are not in the same format as V2 Pool weights
        this.weight = parseFloat(weight.toString()) < 1 ? parseEther(weight.toString()) : BigInt(weight);
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

export class WeightedPool implements BasePool {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: GqlPoolType = 'WEIGHTED';
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly tokens: WeightedPoolToken[];
    public readonly tokenPairs: TokenPairData[];
    public readonly totalShares: bigint;
    public readonly vaultVersion: number;

    private readonly tokenMap: Map<string, WeightedPoolToken>;
    private readonly MAX_INVARIANT_RATIO = BigInt(3e18);
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
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            // TODO: parseFloat with toFixed changes the value, better use parseEther instead
            const balance = parseFloat(poolToken.dynamicData.balance).toFixed(18);
            const tokenAmount = TokenAmount.fromHumanAmount(token, balance as `${number}`);
            //TODO: Remove this once the weight for V3 Pools is in the same format as V2 Pools
            const poolTokenWeight =
                pool.vaultVersion === 3 ? poolToken.dynamicData.weight : parseEther(poolToken.dynamicData.weight);
            poolTokens.push(new WeightedPoolToken(token, tokenAmount.amount, poolTokenWeight, poolToken.index));
        }

        return new WeightedPool(
            pool.id as Hex,
            pool.address,
            pool.chain,
            pool.version,
            parseEther(pool.dynamicData.swapFee),
            poolTokens,
            pool.dynamicData.tokenPairsData as TokenPairData[],
            parseEther(pool.dynamicData.totalShares),
            pool.vaultVersion,
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        poolTypeVersion: number,
        swapFee: bigint,
        tokens: WeightedPoolToken[],
        tokenPairs: TokenPairData[],
        totalShares: bigint,
        vaultVersion: number,
    ) {
        this.chain = chain;
        this.id = id;
        this.poolTypeVersion = poolTypeVersion;
        this.vaultVersion = vaultVersion;
        this.address = address;
        this.swapFee = swapFee;
        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));
        this.tokenPairs = tokenPairs;
        this.totalShares = totalShares;
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tokenPair = this.tokenPairs.find(
            (tokenPair) =>
                (tokenPair.tokenA === tokenIn.address && tokenPair.tokenB === tokenOut.address) ||
                (tokenPair.tokenA === tokenOut.address && tokenPair.tokenB === tokenIn.address),
        );

        if (tokenPair) {
            return parseEther(tokenPair.normalizedLiquidity);
        }
        return 0n;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);
        if (this.vaultVersion === 2) {
            if (swapKind === SwapKind.GivenIn) {
                return (tIn.amount * this.MAX_IN_RATIO) / WAD;
            }
            return (tOut.amount * this.MAX_OUT_RATIO) / WAD;
        } else if (this.vaultVersion === 3) {
            if (swapKind === SwapKind.GivenIn) {
                return tIn.amount;
            }
            return tOut.amount;
        }
        throw new Error("getLimitAmountSwap: Invalid Pool's vaultVersion");
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
