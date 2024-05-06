import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { GqlPoolType } from '../../../../../../schema';
import { Chain } from '@prisma/client';
import { MathSol, WAD } from '../../utils/math';
import { Address, Hex, parseEther } from 'viem';
import { BigintIsh, RemoveLiquidityKind, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { chainToIdMap } from '../../../../../network/network-config';
import { TokenPairData } from '../../../../../pool/lib/pool-on-chain-tokenpair-data';
import { BasePool } from '../basePool';
import { computeAddLiquiditySingleTokenExactOut, computeRemoveLiquiditySingleTokenExactOut } from '../basePoolMathV3';
import { _computeBalance, _computeInvariant } from './weightedMath';

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

    public getLimitAmountAddLiquidity(tokenIn: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        if (!tIn) {
            throw new Error('getLimitAmountAddLiquidity: Token not found');
        }
        return (tIn.amount * this.MAX_IN_RATIO) / WAD;
    }

    public getLimitAmountRemoveLiquidity(
        bpt: Token,
        tokenOut: Token,
        removeLiquidityKind: RemoveLiquidityKind,
    ): bigint {
        const tOut = this.tokenMap.get(tokenOut.wrapped);
        if (!tOut) {
            throw new Error('getLimitRemoveLiquidity: Token not found');
        }
        if (removeLiquidityKind === RemoveLiquidityKind.SingleTokenExactOut) {
            return (tOut.amount * this.MAX_OUT_RATIO) / WAD;
        }
        if (removeLiquidityKind === RemoveLiquidityKind.SingleTokenExactIn) {
            return this.removeLiquiditySingleTokenExactOut(
                tokenOut,
                bpt,
                TokenAmount.fromRawAmount(tokenOut, (tOut.amount * this.MAX_OUT_RATIO) / WAD),
            ).amount;
        }
        throw new Error('getLimitRemoveLiquidity: Invalid RemoveLiquidityKind');
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

    public addLiquiditySingleTokenExactIn(tokenIn: Token, bpt: Token, amount: TokenAmount): TokenAmount {
        try {
            // balances and amounts must be normalized to 1e18 fixed point - e.g. 1USDC => 1e18 not 1e6
            const tokenBalances: bigint[] = [];
            const amountsIn: bigint[] = [];
            const weights: bigint[] = [];
            Array.from(this.tokenMap.values()).forEach((weightedPoolToken) => {
                if (weightedPoolToken.token.isSameAddress(tokenIn.address)) {
                    amountsIn.push(amount.scale18);
                } else {
                    amountsIn.push(0n);
                }
                tokenBalances.push(weightedPoolToken.scale18);
                weights.push(weightedPoolToken.weight);
            });
            const bptAmountOut = this._calcBptOutGivenExactTokensIn(
                tokenBalances,
                weights,
                amountsIn,
                this.totalShares,
            );
            return TokenAmount.fromRawAmount(bpt, bptAmountOut);
        } catch (err) {
            return TokenAmount.fromRawAmount(bpt, 0n);
        }
    }

    public addLiquiditySingleTokenExactOut(tokenIn: Token, amount: TokenAmount): TokenAmount {
        const tokenBalances: bigint[] = [];
        const weights: bigint[] = [];
        const tIn = this.tokenMap.get(tokenIn.address);
        if (!tIn) {
            throw new Error(`Invalid Token: ${tokenIn.address}`);
        }
        Array.from(this.tokenMap.values()).forEach((weightedPoolToken) => {
            tokenBalances.push(weightedPoolToken.scale18);
            weights.push(weightedPoolToken.weight);
        });
        if (this.vaultVersion === 3) {
            const { amountInWithFee } = computeAddLiquiditySingleTokenExactOut(
                tokenBalances,
                tIn.index,
                amount.scale18,
                this.totalShares,
                this.swapFee,
                _computeBalance,
            );
            return TokenAmount.fromRawAmount(tokenIn, amountInWithFee);
        } else {
            throw new Error('addLiquiditySingleTokenExactOut: Invalid Vault Version');
        }
    }

    public removeLiquiditySingleTokenExactIn(tokenOut: Token, amount: TokenAmount): TokenAmount {
        const { amount: tokenBalance, weight: tokenWeight } = Array.from(this.tokenMap.values()).find(
            (weightedPoolToken) => weightedPoolToken.token.isSameAddress(tokenOut.address),
        ) as WeightedPoolToken;
        const tokenAmountOut = this._calcTokenOutGivenExactBptIn(
            tokenBalance,
            tokenWeight,
            amount.scale18,
            this.totalShares,
        );
        return TokenAmount.fromRawAmount(tokenOut, tokenAmountOut);
    }

    removeLiquiditySingleTokenExactOut(tokenOut: Token, bpt: Token, amount: TokenAmount): TokenAmount {
        const tokenBalances: bigint[] = [];
        const weights: bigint[] = [];
        const tOut = this.tokenMap.get(tokenOut.address);
        if (!tOut) {
            throw new Error(`Invalid Token: ${tokenOut.address}`);
        }
        Array.from(this.tokenMap.values()).forEach((weightedPoolToken) => {
            tokenBalances.push(weightedPoolToken.scale18);
            weights.push(weightedPoolToken.weight);
        });
        if (this.vaultVersion === 3) {
            const { bptAmountIn } = computeRemoveLiquiditySingleTokenExactOut(
                tokenBalances,
                tOut.index,
                amount.scale18,
                this.totalShares,
                this.swapFee,
                _computeInvariant,
            );
            return TokenAmount.fromRawAmount(bpt, bptAmountIn);
        } else {
            throw new Error('removeLiquiditySingleTokenExactOut: Invalid Vault Version');
        }
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

    private _calcTokenOutGivenExactBptIn(
        balance: bigint,
        normalizedWeight: bigint,
        bptAmountIn: bigint,
        bptTotalSupply: bigint,
    ): bigint {
        /*****************************************************************************************
         // exactBPTInForTokenOut                                                                //
         // a = amountOut                                                                        //
         // b = balance                     /      /    totalBPT - bptIn       \    (1 / w)  \   //
         // bptIn = bptAmountIn    a = b * |  1 - | --------------------------  | ^           |  //
         // bpt = totalBPT                  \      \       totalBPT            /             /   //
         // w = weight                                                                           //
         *****************************************************************************************/

        // Token out, so we round down overall. The multiplication rounds down, but the power rounds up (so the base
        // rounds up). Because (totalBPT - bptIn) / totalBPT <= 1, the exponent rounds down.
        // Calculate the factor by which the invariant will decrease after burning BPTAmountIn
        const invariantRatio = MathSol.divUpFixed(bptTotalSupply - bptAmountIn, bptTotalSupply);
        // Calculate by how much the token balance has to decrease to match invariantRatio
        const balanceRatio = MathSol.powUpFixed(invariantRatio, MathSol.divDownFixed(WAD, normalizedWeight));

        // Because of rounding up, balanceRatio can be greater than one. Using complement prevents reverts.
        const amountOutWithoutFee = MathSol.mulDownFixed(balance, MathSol.complementFixed(balanceRatio));

        // We can now compute how much excess balance is being withdrawn as a result of the virtual swaps, which result
        // in swap fees.

        // Swap fees are typically charged on 'token in', but there is no 'token in' here, so we apply it
        // to 'token out'. This results in slightly larger price impact. Fees are rounded up.
        const taxableAmount = MathSol.mulUpFixed(amountOutWithoutFee, MathSol.complementFixed(normalizedWeight));
        const nonTaxableAmount = amountOutWithoutFee - taxableAmount;
        const swapFeeAmount = MathSol.mulUpFixed(taxableAmount, this.swapFee);
        const amountOut = nonTaxableAmount + taxableAmount - swapFeeAmount;
        return amountOut;
    }

    private _calcBptOutGivenExactTokensIn(
        balances: bigint[],
        normalizedWeights: bigint[],
        amountsIn: bigint[],
        bptTotalSupply: bigint,
    ): bigint {
        const balanceRatiosWithFee = new Array<bigint>(amountsIn.length);

        let invariantRatioWithFees = 0n;
        for (let i = 0; i < balances.length; i++) {
            balanceRatiosWithFee[i] = MathSol.divDownFixed(balances[i] + amountsIn[i], balances[i]);
            invariantRatioWithFees =
                invariantRatioWithFees + MathSol.mulDownFixed(balanceRatiosWithFee[i], normalizedWeights[i]);
        }

        let invariantRatio = WAD;
        for (let i = 0; i < balances.length; i++) {
            let amountInWithoutFee: bigint;

            if (balanceRatiosWithFee[i] > invariantRatioWithFees) {
                const nonTaxableAmount = MathSol.mulDownFixed(balances[i], invariantRatioWithFees - WAD);
                const taxableAmount = amountsIn[i] - nonTaxableAmount;
                const swapFeeAmount = MathSol.mulUpFixed(taxableAmount, this.swapFee);
                amountInWithoutFee = nonTaxableAmount + taxableAmount - swapFeeAmount;
            } else {
                amountInWithoutFee = amountsIn[i];
            }

            const balanceRatio = MathSol.divDownFixed(balances[i] + amountInWithoutFee, balances[i]);

            invariantRatio = MathSol.mulDownFixed(
                invariantRatio,
                MathSol.powDownFixed(balanceRatio, normalizedWeights[i]),
            );
        }

        if (invariantRatio > WAD) {
            return MathSol.mulDownFixed(bptTotalSupply, invariantRatio - WAD);
        } else {
            return 0n;
        }
    }
    _calcTokenInGivenExactBptOut = (
        balance: bigint,
        normalizedWeight: bigint,
        bptAmountOut: bigint,
        bptTotalSupply: bigint,
    ): bigint => {
        /*****************************************************************************************
         // tokenInForExactBptOut                                                                //
         // a = amountIn                                                                         //
         // b = balance                      /  /     bpt + bptOut     \    (1 / w)      \       //
         // bptOut = bptAmountOut   a = b * |  | ---------------------- | ^          - 1  |      //
         // bpt = bptTotalSupply             \  \         bpt          /                 /       //
         // w = normalizedWeight                                                                 //
         *****************************************************************************************/

        // Token in, so we round up overall

        // Calculate the factor by which the invariant will increase after minting `bptAmountOut`
        const invariantRatio = MathSol.divUpFixed(bptTotalSupply + bptAmountOut, bptTotalSupply);
        if (invariantRatio > this.MAX_INVARIANT_RATIO) {
            throw new Error('MAX_OUT_BPT_FOR_TOKEN_IN');
        }

        // Calculate by how much the token balance has to increase to cause `invariantRatio`
        const balanceRatio = MathSol.powUpFixed(invariantRatio, MathSol.divUpFixed(WAD, normalizedWeight));
        const amountInWithoutFee = MathSol.mulUpFixed(balance, balanceRatio - WAD);
        // We can now compute how much extra balance is being deposited and used in virtual swaps, and charge swap fees accordingly
        const taxablePercentage = MathSol.complementFixed(normalizedWeight);
        const taxableAmount = MathSol.mulUpFixed(amountInWithoutFee, taxablePercentage);
        const nonTaxableAmount = amountInWithoutFee - taxableAmount;

        return nonTaxableAmount + MathSol.divUpFixed(taxableAmount, MathSol.complementFixed(this.swapFee));
    };

    private _calcBptInGivenExactTokensOut(
        balances: bigint[],
        normalizedWeights: bigint[],
        amountsOut: bigint[],
        bptTotalSupply: bigint,
    ): bigint {
        // BPT in, so we round up overall.
        const balanceRatiosWithoutFee = new Array<bigint>(amountsOut.length);

        let invariantRatioWithoutFees = 0n;
        for (let i = 0; i < balances.length; i++) {
            balanceRatiosWithoutFee[i] = MathSol.divUpFixed(balances[i] - amountsOut[i], balances[i]);
            invariantRatioWithoutFees =
                invariantRatioWithoutFees + MathSol.mulUpFixed(balanceRatiosWithoutFee[i], normalizedWeights[i]);
        }

        const invariantRatio = this._computeExitExactTokensOutInvariantRatio(
            balances,
            normalizedWeights,
            amountsOut,
            balanceRatiosWithoutFee,
            invariantRatioWithoutFees,
            this.swapFee,
        );

        return MathSol.mulUpFixed(bptTotalSupply, MathSol.complementFixed(invariantRatio));
    }
    private _computeExitExactTokensOutInvariantRatio(
        balances: bigint[],
        normalizedWeights: bigint[],
        amountsOut: bigint[],
        balanceRatiosWithoutFee: bigint[],
        invariantRatioWithoutFees: bigint,
        swapFeePercentage: bigint,
    ): bigint {
        let invariantRatio = WAD;

        for (let i = 0; i < balances.length; i++) {
            // Swap fees are typically charged on 'token in', but there is no 'token in' here, so we apply it to
            // 'token out'. This results in slightly larger price impact.

            let amountOutWithFee;
            if (invariantRatioWithoutFees > balanceRatiosWithoutFee[i]) {
                const nonTaxableAmount = MathSol.mulDownFixed(
                    balances[i],
                    MathSol.complementFixed(invariantRatioWithoutFees),
                );
                const taxableAmount = amountsOut[i] - nonTaxableAmount;
                const taxableAmountPlusFees = MathSol.divUpFixed(
                    taxableAmount,
                    MathSol.complementFixed(swapFeePercentage),
                );

                amountOutWithFee = nonTaxableAmount + taxableAmountPlusFees;
            } else {
                amountOutWithFee = amountsOut[i];
            }

            const balanceRatio = MathSol.divDownFixed(balances[i] - amountOutWithFee, balances[i]);

            invariantRatio = MathSol.mulDownFixed(
                invariantRatio,
                MathSol.powDownFixed(balanceRatio, normalizedWeights[i]),
            );
        }
        return invariantRatio;
    }
}
