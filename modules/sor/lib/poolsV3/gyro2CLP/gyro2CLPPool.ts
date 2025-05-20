import { Address, Hex, parseEther, parseUnits } from 'viem';

import { PoolType, Token, TokenAmount } from '@balancer/sdk';
import { HookState, Gyro2CLPState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';
import { GyroData } from '../../../../pool/subgraph-mapper';
import { TokenPairData } from '../../../../sources/contracts/v3/fetch-tokenpair-data';

import { BasePoolMethodsV3 } from '../basePoolMethodsV3';

import { getHookState, PoolTokenWithRate, WAD } from '../../utils';

import { LiquidityManagement } from '../../../types';
import { BasePoolV3 } from '../basePoolV3';

type GyroPoolToken = PoolTokenWithRate;

export class Gyro2CLPPool extends BasePoolV3 implements BasePoolMethodsV3 {
    public readonly poolType: PoolType = PoolType.Gyro2;

    public sqrtAlpha: bigint;
    public sqrtBeta: bigint;
    public tokens: GyroPoolToken[];

    private readonly tokenMap: Map<string, GyroPoolToken>;

    static fromPrismaPool(pool: PrismaPoolAndHookWithDynamic): Gyro2CLPPool {
        const poolTokens: GyroPoolToken[] = [];

        if (!pool.dynamicData) throw new Error(`${pool.type} pool has no dynamic data`);

        for (const poolToken of pool.tokens) {
            if (!poolToken.priceRate) throw new Error(`${pool.type} pool token does not have a price rate`);
            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const scale18 = parseEther(poolToken.balance);
            const tokenAmount = TokenAmount.fromScale18Amount(token, scale18);

            poolTokens.push(
                new PoolTokenWithRate(token, tokenAmount.amount, poolToken.index, parseEther(poolToken.priceRate)),
            );
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
            parseEther(pool.dynamicData.aggregateSwapFee),
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
        aggregateSwapFee: bigint,
        tokens: GyroPoolToken[],
        totalShares: bigint,
        sqrtAlpha: bigint,
        sqrtBeta: bigint,
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
    ) {
        super(id, address, chain, swapFee, aggregateSwapFee, totalShares, tokenPairs, liquidityManagement, hookState);
        this.sqrtAlpha = sqrtAlpha;
        this.sqrtBeta = sqrtBeta;

        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new PoolTokenWithRate(bpt, totalShares, -1, WAD));

        this.poolState = this.getPoolState(hookState?.hookType);
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
            aggregateSwapFee: this.aggregateSwapFee,
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
