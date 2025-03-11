import { Address, Hex, parseEther, parseUnits } from 'viem';

import { MAX_UINT256, PoolType, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { AddKind, RemoveKind, Vault, HookState, Gyro2CLPState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../../prisma/prisma-types';
import { chainToChainId as chainToIdMap } from '../../../../../network/chain-id-to-chain';
import { GyroData } from '../../../../../pool/subgraph-mapper';
import { TokenPairData } from '../../../../../sources/contracts/v3/fetch-tokenpair-data';

import { BasePoolV3 } from '../../poolsV2/basePool';

import { Erc4626PoolToken, getHookState, PoolTokenWithRate, WAD } from '../../utils';

import { LiquidityManagement } from '../../../../types';

type GyroPoolToken = PoolTokenWithRate | Erc4626PoolToken;

export class Gyro2CLPPool implements BasePoolV3 {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.Stable;
    public readonly swapFee: bigint;
    public readonly tokenPairs: TokenPairData[];

    public totalShares: bigint;
    public sqrtAlpha: bigint;
    public sqrtBeta: bigint;
    public tokens: GyroPoolToken[];
    public readonly hookState: HookState | undefined;
    public readonly liquidityManagement: LiquidityManagement;

    private readonly tokenMap: Map<string, GyroPoolToken>;

    private vault: Vault;
    private poolState: Gyro2CLPState;

    static fromPrismaPool(
        pool: PrismaPoolAndHookWithDynamic,
        underlyingTokens: { address: string; decimals: number }[],
    ): Gyro2CLPPool {
        const poolTokens: GyroPoolToken[] = [];

        if (!pool.dynamicData) throw new Error('Stable pool has no dynamic data');

        for (const poolToken of pool.tokens) {
            if (!poolToken.priceRate) throw new Error('Stable pool token does not have a price rate');
            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const scale18 = parseEther(poolToken.balance);
            const tokenAmount = TokenAmount.fromScale18Amount(token, scale18);

            if (poolToken.token.underlyingTokenAddress) {
                const underlyingToken = underlyingTokens.find(
                    (token) => token.address === poolToken.token.underlyingTokenAddress,
                );
                if (underlyingToken) {
                    const unwrapRateDecimals = 18 - poolToken.token.decimals + underlyingToken.decimals;
                    poolTokens.push(
                        new Erc4626PoolToken(
                            token,
                            tokenAmount.amount,
                            poolToken.index,
                            parseEther(poolToken.priceRate),
                            parseUnits(poolToken.token.unwrapRate, unwrapRateDecimals),
                            poolToken.token.underlyingTokenAddress,
                        ),
                    );
                } else {
                    poolTokens.push(
                        new PoolTokenWithRate(
                            token,
                            tokenAmount.amount,
                            poolToken.index,
                            parseEther(poolToken.priceRate),
                        ),
                    );
                }
            } else {
                poolTokens.push(
                    new PoolTokenWithRate(token, tokenAmount.amount, poolToken.index, parseEther(poolToken.priceRate)),
                );
            }
        }

        const totalShares = parseEther(pool.dynamicData.totalShares);

        const sqrtAlpha = parseEther((pool.typeData as GyroData).sqrtAlpha);
        const sqrtBeta = parseEther((pool.typeData as GyroData).sqrtBeta);

        //transform
        const hookState = getHookState(pool);

        return new Gyro2CLPPool(
            pool.id as Hex,
            pool.address,
            pool.chain,
            parseEther(pool.dynamicData.swapFee),
            poolTokens,
            totalShares,
            sqrtAlpha,
            sqrtBeta,
            pool.dynamicData.tokenPairsData as TokenPairData[],
            pool.liquidityManagement as unknown as LiquidityManagement,
            hookState,
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        swapFee: bigint,
        tokens: GyroPoolToken[],
        totalShares: bigint,
        sqrtAlpha: bigint,
        sqrtBeta: bigint,
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
    ) {
        this.chain = chain;
        this.id = id;
        this.address = address;
        this.swapFee = swapFee;
        this.totalShares = totalShares;
        this.sqrtAlpha = sqrtAlpha;
        this.sqrtBeta = sqrtBeta;

        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
        this.tokenPairs = tokenPairs;
        this.hookState = hookState;
        this.liquidityManagement = liquidityManagement;

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new PoolTokenWithRate(bpt, totalShares, -1, WAD));

        this.vault = new Vault();
        this.poolState = this.getPoolState(hookState?.hookType);
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        // remove liquidity
        if (tIn.token.isSameAddress(this.id)) {
            return this.vault.getMaxSingleTokenRemoveAmount(
                {
                    isExactIn: swapKind === SwapKind.GivenIn,
                    totalSupply: this.poolState.totalSupply,
                    tokenOutBalance: this.poolState.balancesLiveScaled18[tOut.index],
                    tokenOutScalingFactor: this.poolState.scalingFactors[tOut.index],
                    tokenOutRate: this.poolState.tokenRates[tOut.index],
                },
                this.poolState,
            );
        }
        // add liquidity
        if (tOut.token.isSameAddress(this.id)) {
            return this.vault.getMaxSingleTokenAddAmount(this.poolState);
        }
        // swap
        return this.vault.getMaxSwapAmount(
            {
                swapKind,
                balancesLiveScaled18: this.poolState.balancesLiveScaled18,
                tokenRates: this.poolState.tokenRates,
                scalingFactors: this.poolState.scalingFactors,
                indexIn: tIn.index,
                indexOut: tOut.index,
            },
            this.poolState,
        );
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // remove liquidity
            const { amountsOutRaw } = this.vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOutRaw: this.poolState.tokens.map((_, i) => (i === tOut.index ? 1n : 0n)),
                    maxBptAmountInRaw: swapAmount.amount,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_IN,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = amountsOutRaw[tOut.index];
        } else if (tOut.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // add liquidity
            const { bptAmountOutRaw } = this.vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsInRaw: this.poolState.tokens.map((_, i) => (i === tIn.index ? swapAmount.amount : 0n)),
                    minBptAmountOutRaw: 0n,
                    kind: AddKind.UNBALANCED,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = bptAmountOutRaw;
        } else {
            // swap
            calculatedAmount = this.vault.swap(
                {
                    amountRaw: swapAmount.amount,
                    tokenIn: tIn.token.address,
                    tokenOut: tOut.token.address,
                    swapKind: SwapKind.GivenIn,
                },
                this.poolState,
                this.hookState,
            );
        }
        return TokenAmount.fromRawAmount(tOut.token, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // remove liquidity
            const { bptAmountInRaw } = this.vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOutRaw: this.poolState.tokens.map((_, i) => (i === tOut.index ? swapAmount.amount : 0n)),
                    maxBptAmountInRaw: MAX_UINT256,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_OUT,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = bptAmountInRaw;
        } else if (tOut.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // add liquidity
            const { amountsInRaw } = this.vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsInRaw: this.poolState.tokens.map((_, i) => (i === tIn.index ? MAX_UINT256 : 0n)),
                    minBptAmountOutRaw: swapAmount.amount,
                    kind: AddKind.SINGLE_TOKEN_EXACT_OUT,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = amountsInRaw[tIn.index];
        } else {
            // swap
            calculatedAmount = this.vault.swap(
                {
                    amountRaw: swapAmount.amount,
                    tokenIn: tIn.token.address,
                    tokenOut: tOut.token.address,
                    swapKind: SwapKind.GivenOut,
                },
                this.poolState,
                this.hookState,
            );
        }
        return TokenAmount.fromRawAmount(tIn.token, calculatedAmount);
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

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

    public getPoolState(hookName?: string): Gyro2CLPState {
        const poolState: Gyro2CLPState = {
            poolType: 'GYRO',
            poolAddress: this.address,
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((t) => t.rate),
            totalSupply: this.totalShares,
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar),
            aggregateSwapFee: 0n,
            supportsUnbalancedLiquidity: !this.liquidityManagement.disableUnbalancedLiquidity,
            sqrtAlpha: this.sqrtAlpha,
            sqrtBeta: this.sqrtBeta,
        };

        poolState.hookType = hookName;

        return poolState;
    }

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: GyroPoolToken; tOut: GyroPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
