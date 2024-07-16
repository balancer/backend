import { Address, Hex, parseEther } from 'viem';
import { BigintIsh, PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { Chain } from '@prisma/client';

import { PrismaPoolWithDynamic } from '@/prisma/prisma-types';
import { chainToIdMap } from '@/modules/network/network-config';
import { GyroData } from '@/modules/pool/subgraph-mapper';
import { TokenPairData } from '@/modules/pool/lib/pool-on-chain-tokenpair-data';

import { BasePool } from '../../types';
import { MathSol, WAD } from '../../../utils/math';
import { SWAP_LIMIT_FACTOR } from '../../../utils/gyroHelpers/math';
import { _calcInGivenOut, _calcOutGivenIn, _calculateInvariant, _findVirtualParams } from './gyro2Math';

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
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.Gyro2;
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly tokens: Gyro2PoolToken[];
    public readonly tokenPairs: TokenPairData[];

    private readonly sqrtAlpha: bigint;
    private readonly sqrtBeta: bigint;
    private readonly tokenMap: Map<string, Gyro2PoolToken>;

    static fromPrismaPool(pool: PrismaPoolWithDynamic): Gyro2Pool {
        const poolTokens: Gyro2PoolToken[] = [];

        if (!pool.dynamicData || !pool.typeData) {
            throw new Error('No dynamic data for pool');
        }

        for (const poolToken of pool.tokens) {
            if (!poolToken.dynamicData) {
                throw new Error('Gyro pool as no dynamic pool token data');
            }
            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const tokenAmount = TokenAmount.fromHumanAmount(token, poolToken.dynamicData.balance as `${number}`);

            poolTokens.push(new Gyro2PoolToken(token, tokenAmount.amount, poolToken.index));
        }

        const gyroData = pool.typeData as GyroData;

        return new Gyro2Pool(
            pool.id as Hex,
            pool.address,
            pool.chain,
            pool.version,
            parseEther(pool.dynamicData.swapFee),
            parseEther(gyroData.sqrtAlpha!),
            parseEther(gyroData.sqrtBeta!),
            poolTokens,
            pool.dynamicData.tokenPairsData as TokenPairData[],
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        poolTypeVersion: number,
        swapFee: bigint,
        sqrtAlpha: bigint,
        sqrtBeta: bigint,
        tokens: Gyro2PoolToken[],
        tokenPairs: TokenPairData[],
    ) {
        this.id = id;
        this.address = address;
        this.chain = chain;
        this.poolTypeVersion = poolTypeVersion;
        this.swapFee = swapFee;
        this.sqrtAlpha = sqrtAlpha;
        this.sqrtBeta = sqrtBeta;
        this.tokens = tokens;
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
        this.tokenPairs = tokenPairs;
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

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
