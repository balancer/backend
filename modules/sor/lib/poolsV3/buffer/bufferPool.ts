import { Address, Hex } from 'viem';
import { MAX_UINT256, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { BufferState, Vault } from '@balancer-labs/balancer-maths';

import { BasePoolMethodsV3 } from '../basePoolMethodsV3';
import { BasePoolToken } from '../../utils/basePoolToken';
import { BufferPoolData } from '../../../utils/data';

export class BufferPool implements BasePoolMethodsV3 {
    public readonly chainId: number;
    public readonly id: Hex;
    public readonly address: Address;
    public readonly poolType = 'Buffer';
    public readonly swapFee = 0n;
    public readonly rate: bigint;
    public readonly tokens: BasePoolToken[];

    private readonly tokenMap: Map<string, BasePoolToken>;

    private vault: Vault;
    private poolState: BufferState;

    /**
     * Instantiates a buffer pool from buffer pool data built from erc4626 tokens
     *
     * For context: buffer pool within the SOR is an abstraction that works like
     * a pool where users can trade yield bearing tokens with their underlying token.
     * @param bufferPoolData
     * @returns Buffer pool
     */
    static fromBufferPoolData(bufferPoolData: BufferPoolData): BufferPool {
        return new BufferPool(
            bufferPoolData.address,
            bufferPoolData.address,
            bufferPoolData.chainId,
            bufferPoolData.unwrapRate,
            new BasePoolToken(
                new Token(bufferPoolData.chainId, bufferPoolData.mainToken.address, bufferPoolData.mainToken.decimals),
                MAX_UINT256,
                0,
            ),
            new BasePoolToken(
                new Token(
                    bufferPoolData.chainId,
                    bufferPoolData.underlyingToken.address,
                    bufferPoolData.underlyingToken.decimals,
                ),
                MAX_UINT256,
                1,
            ),
        );
    }

    constructor(
        id: Hex,
        address: Address,
        chainId: number,
        rate: bigint,
        mainToken: BasePoolToken,
        underlyingToken: BasePoolToken,
    ) {
        this.chainId = chainId;
        this.id = id;
        this.address = address;
        this.rate = rate;
        this.tokens = [mainToken, underlyingToken];
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));

        this.vault = new Vault();
        this.poolState = this.getPoolState();
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        return MAX_UINT256;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        return MAX_UINT256;
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        const calculatedAmount = this.vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tIn.token.address,
                tokenOut: tOut.token.address,
                swapKind: SwapKind.GivenIn,
            },
            this.poolState,
        );
        return TokenAmount.fromRawAmount(tOut.token, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        // swap
        const calculatedAmount = this.vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tIn.token.address,
                tokenOut: tOut.token.address,
                swapKind: SwapKind.GivenOut,
            },
            this.poolState,
        );
        return TokenAmount.fromRawAmount(tIn.token, calculatedAmount);
    }

    public getPoolState(): BufferState {
        return {
            poolType: 'Buffer',
            poolAddress: this.address,
            tokens: this.tokens.map((t) => t.token.address),
            rate: this.rate,
        };
    }

    // Helper methods

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: BasePoolToken; tOut: BasePoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
