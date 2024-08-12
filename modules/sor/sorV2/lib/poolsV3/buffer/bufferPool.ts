import { Address, Hex } from 'viem';
import { MAX_UINT256, SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { BufferState, Vault } from '@balancer-labs/balancer-maths';

import { BasePoolV3 } from '../../poolsV2/basePool';
import { BasePoolToken } from '../../poolsV2/basePoolToken';
import { Erc4626PoolToken } from '../../poolsV2/erc4626PoolToken';

export class BufferPool implements BasePoolV3 {
    public readonly chainId: number;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType = 'Buffer';
    public readonly swapFee = 0n;
    public readonly rate: bigint;
    public readonly tokens: BasePoolToken[];

    private readonly tokenMap: Map<string, BasePoolToken>;

    static fromErc4626Token(erc4626Token: Erc4626PoolToken): BufferPool {
        const mainToken = new BasePoolToken(erc4626Token.token, MAX_UINT256, 0);
        const underlyingToken = new BasePoolToken(
            new Token(
                erc4626Token.token.chainId,
                erc4626Token.underlyingTokenAddress as Address,
                erc4626Token.token.decimals,
            ),
            MAX_UINT256,
            1,
        );
        return new BufferPool(
            erc4626Token.token.address,
            erc4626Token.token.address,
            erc4626Token.token.chainId,
            erc4626Token.rate * 10n ** 9n, // scaling up to 27 decimals
            [mainToken, underlyingToken],
        );
    }

    constructor(id: Hex, address: string, chainId: number, rate: bigint, tokens: BasePoolToken[]) {
        this.chainId = chainId;
        this.id = id;
        this.address = address;
        this.rate = rate;
        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        return MAX_UINT256;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        return MAX_UINT256;
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const poolState = this.getPoolState();
        const vault = new Vault();

        const calculatedAmount = vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tIn.token.address,
                tokenOut: tOut.token.address,
                swapKind: SwapKind.GivenIn,
            },
            poolState,
        );
        return TokenAmount.fromRawAmount(tOut.token, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        const poolState = this.getPoolState();
        const vault = new Vault();

        // swap
        const calculatedAmount = vault.swap(
            {
                amountRaw: swapAmount.amount,
                tokenIn: tIn.token.address,
                tokenOut: tOut.token.address,
                swapKind: SwapKind.GivenOut,
            },
            poolState,
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

    public getRequiredTokenPair(tokenIn: Token, tokenOut: Token): { tIn: BasePoolToken; tOut: BasePoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
