import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { Chain } from '@prisma/client';
import { MathSol, WAD } from '../../utils/math';
import { Address, Hex, parseEther, parseUnits } from 'viem';
import {
    _calcBptInGivenExactTokensOut,
    _calcBptOutGivenExactTokensIn,
    _calcInGivenOut,
    _calcOutGivenIn,
    _calcTokenInGivenExactBptOut,
    _calcTokenOutGivenExactBptIn,
    _calculateInvariant,
} from './stableMath';
import { BigintIsh, PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { chainToIdMap } from '../../../../../network/network-config';
import { StableData } from '../../../../../pool/subgraph-mapper';
import { TokenPairData } from '../../../../../pool/lib/pool-on-chain-tokenpair-data';
import { BasePool } from '../basePool';

export class ComposableStablePoolToken extends TokenAmount {
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

export class ComposableStablePool implements BasePool {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.ComposableStable;
    public readonly amp: bigint;
    public readonly swapFee: bigint;
    public readonly bptIndex: number;
    public readonly tokenPairs: TokenPairData[];

    public totalShares: bigint;
    public tokens: ComposableStablePoolToken[];

    private readonly tokenMap: Map<string, ComposableStablePoolToken>;
    private readonly tokenIndexMap: Map<string, number>;

    static fromPrismaPool(pool: PrismaPoolWithDynamic): ComposableStablePool {
        const poolTokens: ComposableStablePoolToken[] = [];

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
                new ComposableStablePoolToken(
                    token,
                    tokenAmount.amount,
                    parseEther(poolToken.dynamicData.priceRate),
                    poolToken.index,
                ),
            );
        }

        const totalShares = parseEther(pool.dynamicData.totalShares);
        const amp = parseUnits((pool.typeData as StableData).amp, 3);

        return new ComposableStablePool(
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
        tokens: ComposableStablePoolToken[],
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

        this.bptIndex = this.tokens.findIndex((t) => t.token.address === this.address);
        this.tokenPairs = tokenPairs;
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');

        const tokenPair = this.tokenPairs.find(
            (tokenPair) =>
                (tokenPair.tokenA === tIn.token.address && tokenPair.tokenB === tOut.token.address) ||
                (tokenPair.tokenA === tOut.token.address && tokenPair.tokenB === tIn.token.address),
        );

        if (tokenPair) {
            return BigInt(tokenPair.normalizedLiquidity);
        }
        return 0n;
    }

    public swapGivenIn(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const tInIndex = this.tokenIndexMap.get(tokenIn.wrapped);
        const tOutIndex = this.tokenIndexMap.get(tokenOut.wrapped);

        if (typeof tInIndex !== 'number' || typeof tOutIndex !== 'number') {
            throw new Error('Pool does not contain the tokens provided');
        }

        const balancesNoBpt = this.dropBptItem(this.tokens.map((t) => t.scale18));

        // TODO: Fix stable swap limit
        if (swapAmount.scale18 > this.tokens[tInIndex].scale18) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        const invariant = _calculateInvariant(this.amp, balancesNoBpt);

        let tokenOutScale18: bigint;
        if (tokenIn.isUnderlyingEqual(this.tokens[this.bptIndex].token)) {
            const amountInWithRate = swapAmount.mulDownFixed(this.tokens[tInIndex].rate);

            tokenOutScale18 = _calcTokenOutGivenExactBptIn(
                this.amp,
                [...balancesNoBpt],
                this.skipBptIndex(tOutIndex),
                amountInWithRate.scale18,
                this.totalShares,
                invariant,
                this.swapFee,
            );
        } else if (tokenOut.isUnderlyingEqual(this.tokens[this.bptIndex].token)) {
            const amountsIn = new Array(balancesNoBpt.length).fill(0n);

            const amountInWithRate = swapAmount.mulDownFixed(this.tokens[tInIndex].rate);
            amountsIn[this.skipBptIndex(tInIndex)] = amountInWithRate.scale18;

            tokenOutScale18 = _calcBptOutGivenExactTokensIn(
                this.amp,
                [...balancesNoBpt],
                amountsIn,
                this.totalShares,
                invariant,
                this.swapFee,
            );
        } else {
            const amountInWithFee = this.subtractSwapFeeAmount(swapAmount);
            const amountInWithRate = amountInWithFee.mulDownFixed(this.tokens[tInIndex].rate);

            tokenOutScale18 = _calcOutGivenIn(
                this.amp,
                [...balancesNoBpt],
                this.skipBptIndex(tInIndex),
                this.skipBptIndex(tOutIndex),
                amountInWithRate.scale18,
                invariant,
            );
        }

        const amountOut = TokenAmount.fromScale18Amount(tokenOut, tokenOutScale18);
        const amountOutWithRate = amountOut.divDownFixed(this.tokens[tOutIndex].rate);

        if (amountOutWithRate.amount < 0n) throw new Error('Swap output negative');

        if (mutateBalances) {
            this.tokens[tInIndex].increase(swapAmount.amount);
            this.tokens[tOutIndex].decrease(amountOutWithRate.amount);

            if (tInIndex === this.bptIndex) {
                this.totalShares = this.totalShares - swapAmount.amount;
            } else if (tOutIndex === this.bptIndex) {
                this.totalShares = this.totalShares + amountOutWithRate.amount;
            }
        }

        return amountOutWithRate;
    }

    public swapGivenOut(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const tInIndex = this.tokenIndexMap.get(tokenIn.wrapped);
        const tOutIndex = this.tokenIndexMap.get(tokenOut.wrapped);

        if (typeof tInIndex !== 'number' || typeof tOutIndex !== 'number') {
            throw new Error('Pool does not contain the tokens provided');
        }

        const balancesNoBpt = this.dropBptItem(this.tokens.map((t) => t.scale18));

        // TODO: Fix stable swap limit
        if (swapAmount.scale18 > this.tokens[tOutIndex].scale18) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        const amountOutWithRate = swapAmount.mulDownFixed(this.tokens[tOutIndex].rate);

        const invariant = _calculateInvariant(this.amp, balancesNoBpt);

        let amountIn: TokenAmount;
        if (tokenIn.isUnderlyingEqual(this.tokens[this.bptIndex].token)) {
            const amountsOut = new Array(balancesNoBpt.length).fill(0n);
            amountsOut[this.skipBptIndex(tOutIndex)] = amountOutWithRate.scale18;

            const tokenInScale18 = _calcBptInGivenExactTokensOut(
                this.amp,
                [...balancesNoBpt],
                amountsOut,
                this.totalShares,
                invariant,
                this.swapFee,
            );

            amountIn = TokenAmount.fromScale18Amount(tokenIn, tokenInScale18, true).divDownFixed(
                this.tokens[tInIndex].rate,
            );
        } else if (tokenOut.isUnderlyingEqual(this.tokens[this.bptIndex].token)) {
            const tokenInScale18 = _calcTokenInGivenExactBptOut(
                this.amp,
                [...balancesNoBpt],
                this.skipBptIndex(tInIndex),
                amountOutWithRate.scale18,
                this.totalShares,
                invariant,
                this.swapFee,
            );

            amountIn = TokenAmount.fromScale18Amount(tokenIn, tokenInScale18, true).divDownFixed(
                this.tokens[tInIndex].rate,
            );
        } else {
            const tokenInScale18 = _calcInGivenOut(
                this.amp,
                [...balancesNoBpt],
                this.skipBptIndex(tInIndex),
                this.skipBptIndex(tOutIndex),
                amountOutWithRate.scale18,
                invariant,
            );

            const amountInWithoutFee = TokenAmount.fromScale18Amount(tokenIn, tokenInScale18, true);
            const amountInWithFee = this.addSwapFeeAmount(amountInWithoutFee);

            amountIn = amountInWithFee.divDownFixed(this.tokens[tInIndex].rate);
        }

        if (amountIn.amount < 0n) throw new Error('Swap output negative');

        if (mutateBalances) {
            this.tokens[tInIndex].increase(amountIn.amount);
            this.tokens[tOutIndex].decrease(swapAmount.amount);

            if (tInIndex === this.bptIndex) {
                this.totalShares = this.totalShares - amountIn.amount;
            } else if (tOutIndex === this.bptIndex) {
                this.totalShares = this.totalShares + swapAmount.amount;
            }
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

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
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

    public skipBptIndex(index: number): number {
        if (index === this.bptIndex) throw new Error('Cannot skip BPT index');
        return index < this.bptIndex ? index : index - 1;
    }

    public dropBptItem(amounts: bigint[]): bigint[] {
        const amountsWithoutBpt = new Array(amounts.length - 1).fill(0n);
        for (let i = 0; i < amountsWithoutBpt.length; i++) {
            amountsWithoutBpt[i] = amounts[i < this.bptIndex ? i : i + 1];
        }
        return amountsWithoutBpt;
    }
}
