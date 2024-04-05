import { BasePool } from '../basePool';
import { BigintIsh, PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { Address, Hex, parseEther, parseUnits } from 'viem';
import { Chain } from '@prisma/client';
import { TokenPairData } from '../../../../../pool/lib/pool-on-chain-tokenpair-data';
import { MathSol, WAD } from '../../utils/math';
import {
    _calcBptInGivenExactTokensOut,
    _calcBptOutGivenExactTokensIn,
    _calcInGivenOut,
    _calcOutGivenIn,
    _calcTokenInGivenExactBptOut,
    _calcTokenOutGivenExactBptIn,
    _calculateInvariant,
} from './stableMath';
import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { chainToIdMap } from '../../../../../network/network-config';
import { StableData } from '../../../../../pool/subgraph-mapper';
import { WeightedPoolToken } from '../weighted/weightedPool';

export class StablePoolToken extends TokenAmount {
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

export class StablePool implements BasePool {
    public readonly chain: Chain;
    readonly address: string;
    readonly id: Hex;
    readonly poolType: PoolType | string = PoolType.Stable;
    swapFee: bigint;
    tokens: StablePoolToken[];
    public readonly amp: bigint;
    public totalShares: bigint;
    private readonly tokenMap: Map<string, StablePoolToken>;
    private readonly tokenIndexMap: Map<string, number>;
    public readonly tokenPairs: TokenPairData[];

    static fromPrismaPool(pool: PrismaPoolWithDynamic): StablePool {
        const poolTokens: StablePoolToken[] = [];

        if (!pool.dynamicData) throw new Error('Stable pool has no dynamic data');

        for (const poolToken of pool.tokens) {
            if (!poolToken.dynamicData?.priceRate) throw new Error('Stable pool token does not have a price rate');
            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const tokenAmount = TokenAmount.fromHumanAmount(token, `${parseFloat(poolToken.dynamicData.balance)}`);

            poolTokens.push(
                new StablePoolToken(
                    token,
                    tokenAmount.amount,
                    parseEther(poolToken.dynamicData.priceRate),
                    poolToken.index,
                ),
            );
        }

        const totalShares = parseEther(pool.dynamicData.totalShares);
        const amp = parseUnits((pool.typeData as StableData).amp, 3);

        return new StablePool(
            pool.id as Hex,
            pool.address,
            pool.chain,
            amp,
            parseEther(pool.dynamicData.swapFee),
            poolTokens,
            totalShares,
            pool.dynamicData.tokenPairsData as TokenPairData[],
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        amp: bigint,
        swapFee: bigint,
        tokens: StablePoolToken[],
        totalShares: bigint,
        tokenPairs: TokenPairData[],
    ) {
        this.chain = chain;
        this.id = id;
        this.address = address;
        this.amp = amp;
        this.swapFee = swapFee;
        this.totalShares = totalShares;

        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
        this.tokenIndexMap = new Map(this.tokens.map((token) => [token.token.address, token.index]));
        this.tokenPairs = tokenPairs;
    }

    addLiquiditySingleTokenExactIn(
        tokenIn: Token,
        bpt: Token,
        amount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        try {
            // balances and amounts must be normalized to 1e18 fixed point - e.g. 1USDC => 1e18 not 1e6
            const tokenBalances: bigint[] = [];
            const amountsIn: bigint[] = [];
            Array.from(this.tokenMap.values()).forEach((stablePoolToken) => {
                if (stablePoolToken.token.isSameAddress(tokenIn.address)) {
                    amountsIn.push(amount.scale18);
                } else {
                    amountsIn.push(0n);
                }
                tokenBalances.push(stablePoolToken.scale18);
            });
            const currentInvariant = _calculateInvariant(this.amp, tokenBalances);
            const bptAmountOut = _calcBptOutGivenExactTokensIn(
                this.amp,
                tokenBalances,
                amountsIn,
                this.totalShares,
                currentInvariant,
                this.swapFee,
            );
            return TokenAmount.fromRawAmount(bpt, bptAmountOut);
        } catch (err) {
            return TokenAmount.fromRawAmount(bpt, 0n);
        }
    }

    addLiquiditySingleTokenExactOut(
        tokenIn: Token,
        bpt: Token,
        amount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        try {
            const tokenInIndex = this.tokenIndexMap.get(tokenIn.address);
            if (!tokenInIndex) throw new Error('Provided Token In is Invalid');
            const tokenBalances = Array.from(this.tokens.values()).map(({ scale18 }) => scale18);
            const currentInvariant = _calculateInvariant(this.amp, tokenBalances);
            const tokenInAmount = _calcTokenInGivenExactBptOut(
                this.amp,
                tokenBalances,
                tokenInIndex,
                amount.scale18,
                this.totalShares,
                currentInvariant,
                this.swapFee,
            );
            return TokenAmount.fromRawAmount(tokenIn, tokenInAmount);
        } catch (err) {
            return TokenAmount.fromRawAmount(tokenIn, 0n);
        }
    }

    getLimitAmountAddLiquidity(tokenIn: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.address);
        if (!tIn) throw new Error('Pool does not contain the token provided');
        return (tIn.amount * WAD) / tIn.rate;
    }

    getLimitAmountRemoveLiquidity(): bigint {
        //TODO add division by BPT price rate
        return this.totalShares;
    }

    getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const tIn = this.tokenMap.get(tokenIn.address);
        const tOut = this.tokenMap.get(tokenOut.address);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');

        if (swapKind === SwapKind.GivenIn) {
            // Return max valid amount of tokenIn
            return (tIn.amount * WAD) / tIn.rate;
        }
        // Return max amount of tokenOut - approx is almost all balance
        return (tOut.amount * WAD) / tOut.rate;
    }

    getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');

        const tokenPair = this.tokenPairs.find(
            (tokenPair) =>
                (tokenPair.tokenA === tIn.token.address && tokenPair.tokenB === tOut.token.address) ||
                (tokenPair.tokenA === tOut.token.address && tokenPair.tokenB === tIn.token.address),
        );

        if (tokenPair) {
            return parseEther(tokenPair.normalizedLiquidity);
        }
        return 0n;
    }

    removeLiquiditySingleTokenExactIn(
        tokenOut: Token,
        bpt: Token,
        amount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const tokenOutIndex = this.tokenIndexMap.get(tokenOut.address);
        if (!tokenOutIndex) throw new Error('Provided Token Out is Invalid');
        const tokenBalances = Array.from(this.tokens.values()).map(({ scale18 }) => scale18);
        const currentInvariant = _calculateInvariant(this.amp, tokenBalances);
        const tokenAmountOut = _calcTokenOutGivenExactBptIn(
            this.amp,
            tokenBalances,
            tokenOutIndex,
            amount.scale18,
            this.totalShares,
            currentInvariant,
            this.swapFee,
        );
        return TokenAmount.fromRawAmount(tokenOut, tokenAmountOut);
    }

    removeLiquiditySingleTokenExactOut(
        tokenOut: Token,
        bpt: Token,
        amount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const tokenBalances: bigint[] = [];
        const amountsOut: bigint[] = [];
        const tokenOutIndex = this.tokenIndexMap.get(tokenOut.address);
        if (!tokenOutIndex) throw new Error('Provided Token Out is Invalid');
        Array.from(this.tokenMap.values()).forEach((stablePoolToken, index) => {
            if (stablePoolToken.token.isSameAddress(tokenOut.address)) {
                amountsOut.push(amount.scale18);
            } else {
                amountsOut.push(0n);
            }
            tokenBalances.push(stablePoolToken.scale18);
        });
        const currentInvariant = _calculateInvariant(this.amp, tokenBalances);
        const tokenAmountOut = _calcBptInGivenExactTokensOut(
            this.amp,
            tokenBalances,
            amountsOut,
            this.totalShares,
            currentInvariant,
            this.swapFee,
        );
        return TokenAmount.fromRawAmount(tokenOut, tokenAmountOut);
    }

    swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount {
        const tInIndex = this.tokenIndexMap.get(tokenIn.wrapped);
        const tOutIndex = this.tokenIndexMap.get(tokenOut.wrapped);

        if (typeof tInIndex !== 'number' || typeof tOutIndex !== 'number') {
            throw new Error('Pool does not contain the tokens provided');
        }

        const balances = this.tokens.map((t) => t.scale18);

        // TODO: Fix stable swap limit
        if (swapAmount.scale18 > this.tokens[tInIndex].scale18) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        const invariant = _calculateInvariant(this.amp, balances);

        let tokenOutScale18: bigint;
        const amountInWithFee = this.subtractSwapFeeAmount(swapAmount);
        const amountInWithRate = amountInWithFee.mulDownFixed(this.tokens[tInIndex].rate);

        tokenOutScale18 = _calcOutGivenIn(this.amp, balances, tInIndex, tOutIndex, amountInWithRate.scale18, invariant);

        const amountOut = TokenAmount.fromScale18Amount(tokenOut, tokenOutScale18);
        const amountOutWithRate = amountOut.divDownFixed(this.tokens[tOutIndex].rate);

        if (amountOutWithRate.amount < 0n) throw new Error('Swap output negative');

        if (mutateBalances) {
            this.tokens[tInIndex].increase(swapAmount.amount);
            this.tokens[tOutIndex].decrease(amountOutWithRate.amount);
        }

        return amountOutWithRate;
    }

    swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount, mutateBalances?: boolean): TokenAmount {
        const tInIndex = this.tokenIndexMap.get(tokenIn.wrapped);
        const tOutIndex = this.tokenIndexMap.get(tokenOut.wrapped);

        if (typeof tInIndex !== 'number' || typeof tOutIndex !== 'number') {
            throw new Error('Pool does not contain the tokens provided');
        }

        const balances = this.tokens.map((t) => t.scale18);

        // TODO: Fix stable swap limit
        if (swapAmount.scale18 > this.tokens[tOutIndex].scale18) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        const amountOutWithRate = swapAmount.mulDownFixed(this.tokens[tOutIndex].rate);

        const invariant = _calculateInvariant(this.amp, balances);

        let amountIn: TokenAmount;
        const tokenInScale18 = _calcInGivenOut(
            this.amp,
            balances,
            tInIndex,
            tOutIndex,
            amountOutWithRate.scale18,
            invariant,
        );

        const amountInWithoutFee = TokenAmount.fromScale18Amount(tokenIn, tokenInScale18, true);
        const amountInWithFee = this.addSwapFeeAmount(amountInWithoutFee);

        amountIn = amountInWithFee.divDownFixed(this.tokens[tInIndex].rate);

        if (amountIn.amount < 0n) throw new Error('Swap output negative');

        if (mutateBalances) {
            this.tokens[tInIndex].increase(amountIn.amount);
            this.tokens[tOutIndex].decrease(swapAmount.amount);
        }

        return amountIn;
    }

    public subtractSwapFeeAmount(amount: TokenAmount): TokenAmount {
        const feeAmount = amount.mulUpFixed(this.swapFee);
        return amount.sub(feeAmount);
    }

    public addSwapFeeAmount(amount: TokenAmount): TokenAmount {
        return amount.divUpFixed(MathSol.complementFixed(this.swapFee));
    }
}
