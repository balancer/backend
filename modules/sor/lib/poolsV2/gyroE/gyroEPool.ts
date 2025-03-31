import { Address, Hex, parseEther, parseUnits } from 'viem';
import { Chain } from '@prisma/client';
import { PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { MathSol, WAD } from '../../utils/math';
import { MathGyro, SWAP_LIMIT_FACTOR } from '../../utils/gyroHelpers/math';
import { DerivedGyroEParams, GyroEParams, Vector2 } from './types';
import { balancesFromTokenInOut, virtualOffset0, virtualOffset1 } from './gyroEMathHelpers';
import { calculateInvariantWithError, calcOutGivenIn, calcInGivenOut } from './gyroEMath';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';
import { GyroData } from '../../../../pool/subgraph-mapper';
import { TokenPairData } from '../../../../pool/lib/pool-on-chain-tokenpair-data';
import { BasePool } from '../basePool';
import { PoolTokenWithRate } from '../../utils/poolTokenWithRate';

export class GyroEPool implements BasePool {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.GyroE;
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly tokens: PoolTokenWithRate[];
    public readonly gyroEParams: GyroEParams;
    public readonly derivedGyroEParams: DerivedGyroEParams;
    public readonly tokenPairs: TokenPairData[];

    private readonly tokenMap: Map<string, PoolTokenWithRate>;

    static fromPrismaPool(pool: PrismaPoolAndHookWithDynamic): GyroEPool {
        const poolTokens: PoolTokenWithRate[] = [];

        if (!pool.dynamicData || !pool.typeData) {
            throw new Error('No dynamic data for pool');
        }

        for (const poolToken of pool.tokens) {
            if (!poolToken.balance || !poolToken.priceRate) {
                throw new Error('Gyro pool as no dynamic pool token data');
            }

            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const scale18 = parseEther(poolToken.balance);
            const tokenAmount = TokenAmount.fromScale18Amount(token, scale18);
            const tokenRate = poolToken.priceRate;

            poolTokens.push(new PoolTokenWithRate(token, tokenAmount.amount, poolToken.index, parseEther(tokenRate)));
        }

        const gyroData = pool.typeData as GyroData;

        const gyroEParams: GyroEParams = {
            alpha: parseEther(gyroData.alpha),
            beta: parseEther(gyroData.beta),
            c: parseEther(gyroData.c),
            s: parseEther(gyroData.s),
            lambda: parseEther(gyroData.lambda),
        };

        const derivedGyroEParams: DerivedGyroEParams = {
            tauAlpha: {
                x: parseUnits(gyroData.tauAlphaX, 38),
                y: parseUnits(gyroData.tauAlphaY, 38),
            },
            tauBeta: {
                x: parseUnits(gyroData.tauBetaX, 38),
                y: parseUnits(gyroData.tauBetaY, 38),
            },
            u: parseUnits(gyroData.u, 38),
            v: parseUnits(gyroData.v, 38),
            w: parseUnits(gyroData.w, 38),
            z: parseUnits(gyroData.z, 38),
            dSq: parseUnits(gyroData.dSq, 38),
        };

        return new GyroEPool(
            pool.id as Hex,
            pool.address,
            pool.chain,
            pool.version,
            parseEther(pool.dynamicData.swapFee),
            poolTokens,
            gyroEParams,
            derivedGyroEParams,
            pool.dynamicData.tokenPairsData as TokenPairData[],
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        poolTypeVersion: number,
        swapFee: bigint,
        tokens: PoolTokenWithRate[],
        gyroEParams: GyroEParams,
        derivedGyroEParams: DerivedGyroEParams,
        tokenPairs: TokenPairData[],
    ) {
        this.id = id;
        this.address = address;
        this.chain = chain;
        this.poolTypeVersion = poolTypeVersion;
        this.swapFee = swapFee;
        this.tokens = tokens;
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
        this.gyroEParams = gyroEParams;
        this.derivedGyroEParams = derivedGyroEParams;
        this.tokenPairs = tokenPairs;
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

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
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);
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
        // swapAmount from PathWithAmount does not take rate into account - this step fixes scale18 so it properly considers rates
        const swapAmountLessFee = this.subtractSwapFeeAmount(swapAmount);
        const inAmountLive = new PoolTokenWithRate(tokenIn, swapAmountLessFee.amount, tIn.index, tIn.rate);
        const outAmountScale18 = calcOutGivenIn(
            orderedNormalizedBalances,
            inAmountLive.scale18,
            tIn.index === 0,
            this.gyroEParams,
            this.derivedGyroEParams,
            invariant,
        );

        const outAmount = PoolTokenWithRate.fromScale18AmountWithRate(
            tokenOut,
            outAmountScale18,
            tOut.rate,
            tOut.index,
        );

        if (mutateBalances) {
            tIn.increase(inAmountLive.amount);
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
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);
        // swapAmount from PathWithAmount does not take rate into account - this step fixes scale18 so it properly considers rates
        const outAmountLive = new PoolTokenWithRate(tokenOut, swapAmount.amount, tOut.index, tOut.rate);
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
            outAmountLive.scale18,
            tIn.index === 0,
            this.gyroEParams,
            this.derivedGyroEParams,
            invariant,
        );

        const inAmount = this.addSwapFeeAmount(
            PoolTokenWithRate.fromScale18AmountWithRate(tokenIn, inAmountLessFee, tIn.rate, tIn.index, true),
        );

        if (mutateBalances) {
            tIn.decrease(inAmount.amount);
            tOut.increase(outAmountLive.amount);
        }

        return inAmount;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);
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

    public getPoolTokens(
        tokenIn: Token,
        tokenOut: Token,
    ): {
        tIn: PoolTokenWithRate;
        tOut: PoolTokenWithRate;
    } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
