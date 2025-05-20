import { Address, Hex, parseEther, parseUnits } from 'viem';
import { PoolType, Token } from '@balancer/sdk';
import { StableState, HookState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';
import { StableData } from '../../../../pool/subgraph-mapper';
import { TokenPairData } from '../../../../sources/contracts/v3/fetch-tokenpair-data';

import { WAD } from '../../utils/math';
import { BasePoolMethodsV3 } from '../basePoolMethodsV3';
import { PoolTokenWithRate } from '../../utils/poolTokenWithRate';

import { getHookState } from '../../utils/helpers';

import { LiquidityManagement } from '../../../../sor/types';
import { BasePoolV3 } from '../basePoolV3';

type StablePoolToken = PoolTokenWithRate;

export class StablePoolV3 extends BasePoolV3 implements BasePoolMethodsV3 {
    public readonly poolType: PoolType = PoolType.Stable;
    public readonly amp: bigint;

    public tokens: StablePoolToken[];

    private readonly tokenMap: Map<string, StablePoolToken>;

    static fromPrismaPool(pool: PrismaPoolAndHookWithDynamic): StablePoolV3 {
        const poolTokens: StablePoolToken[] = [];

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
            const amount = parseUnits(poolToken.balance, poolToken.token.decimals);

            poolTokens.push(new PoolTokenWithRate(token, amount, poolToken.index, parseEther(poolToken.priceRate)));
        }

        const totalShares = parseEther(pool.dynamicData.totalShares);
        const amp = parseUnits((pool.typeData as StableData).amp, 3);

        //transform
        const hookState = getHookState(pool);

        return new StablePoolV3(
            pool.id as Hex,
            pool.address,
            pool.chain,
            amp,
            parseEther(pool.dynamicData.swapFee),
            parseEther(pool.dynamicData.aggregateSwapFee),
            poolTokens,
            totalShares,
            pool.dynamicData.tokenPairsData as TokenPairData[],
            pool.liquidityManagement as unknown as LiquidityManagement,
            hookState,
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        amp: bigint,
        swapFee: bigint,
        aggregateSwapFee: bigint,
        tokens: StablePoolToken[],
        totalShares: bigint,
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
    ) {
        super(id, address, chain, swapFee, aggregateSwapFee, totalShares, tokenPairs, liquidityManagement, hookState);
        this.amp = amp;

        this.tokens = tokens.sort((a, b) => a.index - b.index);
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new PoolTokenWithRate(bpt, totalShares, -1, WAD));

        this.poolState = this.getPoolState(hookState?.hookType);
    }

    public getPoolState(hookName?: string): StableState {
        const poolState: StableState = {
            poolType: 'STABLE',
            poolAddress: this.address,
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((t) => t.rate),
            totalSupply: this.totalShares,
            amp: this.amp,
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar),
            aggregateSwapFee: this.aggregateSwapFee,
            supportsUnbalancedLiquidity: !this.liquidityManagement.disableUnbalancedLiquidity,
        };

        poolState.hookType = hookName;

        return poolState;
    }

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: StablePoolToken; tOut: StablePoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
