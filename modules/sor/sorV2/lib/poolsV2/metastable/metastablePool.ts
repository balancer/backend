import { Chain } from '@prisma/client';
import { Address, Hex, parseEther, parseUnits } from 'viem';
import { ComposableStablePoolToken } from '../composableStable/composableStablePool';
import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { _calcInGivenOut, _calcOutGivenIn, _calculateInvariant } from '../composableStable/stableMath';
import { MathSol, WAD } from '../../utils/math';
import { PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { chainToIdMap } from '../../../../../network/network-config';
import { StableData } from '../../../../../pool/subgraph-mapper';
import { TokenPairData } from '../../../../../pool/lib/pool-on-chain-tokenpair-data';
import { BasePool } from '../basePool';

export class MetaStablePool implements BasePool {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.MetaStable;
    public readonly amp: bigint;
    public readonly swapFee: bigint;
    public readonly tokens: ComposableStablePoolToken[];
    public readonly tokenPairs: TokenPairData[];

    private readonly tokenMap: Map<string, ComposableStablePoolToken>;
    private readonly tokenIndexMap: Map<string, number>;

    static fromPrismaPool(pool: PrismaPoolWithDynamic): MetaStablePool {
        const poolTokens: ComposableStablePoolToken[] = [];

        if (!pool.dynamicData) throw new Error('Stable pool has no dynamic data');

        for (const poolToken of pool.tokens) {
            if (!poolToken.dynamicData?.priceRate) throw new Error('Meta Stable pool token does not have a price rate');
            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const scale18 = parseEther(poolToken.dynamicData.balance);
            const tokenAmount = TokenAmount.fromScale18Amount(token, scale18);

            poolTokens.push(
                new ComposableStablePoolToken(
                    token,
                    tokenAmount.amount,
                    poolToken.index,
                    parseEther(poolToken.dynamicData.priceRate),
                ),
            );
        }

        const amp = parseUnits((pool.typeData as StableData).amp, 3);

        return new MetaStablePool(
            pool.id as Hex,
            pool.address,
            pool.chain,
            amp,
            parseEther(pool.dynamicData.swapFee),
            poolTokens,
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
        tokenPairs: TokenPairData[],
    ) {
        this.id = id;
        this.address = address;
        this.chain = chain;
        this.amp = amp;
        this.swapFee = swapFee;

        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
        this.tokenIndexMap = new Map(this.tokens.map((token) => [token.token.address, token.index]));
        this.tokenPairs = tokenPairs;
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.address);
        const tOut = this.tokenMap.get(tokenOut.address);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');

        const tokenPair = this.tokenPairs.find(
            (tokenPair) => tokenPair.tokenA === tIn.token.address && tokenPair.tokenB === tOut.token.address,
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
