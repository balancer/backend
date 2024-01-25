import { Hex, parseEther } from 'viem';
import { PoolType, SwapKind } from '../../../types';
import { Token } from '../../token';
import { TokenAmount, BigintIsh } from '../../tokenAmount';
import { BasePool } from '..';
import { getPoolAddress, MAX_UINT112, WAD } from '../../../utils';
import {
    _calcBptOutPerMainIn,
    _calcBptOutPerWrappedIn,
    _calcMainOutPerBptIn,
    _calcMainOutPerWrappedIn,
    _calcWrappedOutPerBptIn,
    _calcWrappedOutPerMainIn,
    _calcMainInPerWrappedOut,
    _calcMainInPerBptOut,
    _calcWrappedInPerMainOut,
    _calcWrappedInPerBptOut,
    _calcBptInPerWrappedOut,
    _calcBptInPerMainOut,
} from './linearMath';
import { StablePoolToken } from '../stablePool';
import { RawLinearPool } from '../../../data/types';
import { Params } from './types';

const MAX_RATIO = parseEther('10');
const MAX_TOKEN_BALANCE = MAX_UINT112 - 1n;

type LinearPoolToken = BPT | StablePoolToken;

class BPT extends TokenAmount {
    public readonly rate: bigint;
    public readonly index: number;
    public virtualBalance: bigint;

    public constructor(token: Token, amount: BigintIsh, index: number) {
        super(token, amount);
        this.rate = WAD;
        this.virtualBalance = MAX_TOKEN_BALANCE - this.amount;
        this.index = index;
    }

    public increase(amount: bigint): TokenAmount {
        this.amount = this.amount + amount;
        this.virtualBalance = this.virtualBalance + amount;
        this.scale18 = this.amount * this.scalar;
        return this;
    }

    public decrease(amount: bigint): TokenAmount {
        this.amount = this.amount - amount;
        this.virtualBalance = this.virtualBalance - amount;
        this.scale18 = this.amount * this.scalar;
        return this;
    }
}

export class LinearPool implements BasePool {
    public readonly chainId: number;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: PoolType = PoolType.AaveLinear;
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly mainToken: StablePoolToken;
    public readonly wrappedToken: StablePoolToken;
    public readonly bptToken: BPT;
    public readonly params: Params;
    public readonly tokens: LinearPoolToken[];

    private readonly tokenMap: Map<string, LinearPoolToken>;

    static fromRawPool(chainId: number, pool: RawLinearPool): LinearPool {
        const orderedTokens = pool.tokens.sort((a, b) => a.index - b.index);
        const swapFee = parseEther(pool.swapFee);

        const mT = orderedTokens[pool.mainIndex];
        const mTRate = parseEther(mT.priceRate || '1.0');
        const mToken = new Token(chainId, mT.address, mT.decimals, mT.symbol, mT.name);
        const lowerTarget = TokenAmount.fromHumanAmount(mToken, pool.lowerTarget);
        const upperTarget = TokenAmount.fromHumanAmount(mToken, pool.upperTarget);
        const mTokenAmount = TokenAmount.fromHumanAmount(mToken, mT.balance);
        const mainToken = new StablePoolToken(mToken, mTokenAmount.amount, mTRate, mT.index);

        const wT = orderedTokens[pool.wrappedIndex];
        const wTRate = parseEther(wT.priceRate || '1.0');

        const wToken = new Token(chainId, wT.address, wT.decimals, wT.symbol, wT.name);
        const wTokenAmount = TokenAmount.fromHumanAmount(wToken, wT.balance);
        const wrappedToken = new StablePoolToken(wToken, wTokenAmount.amount, wTRate, wT.index);

        const bptIndex: number = orderedTokens.findIndex((t) => t.address === pool.address);
        const bT = orderedTokens[bptIndex];
        const bToken = new Token(chainId, bT.address, bT.decimals, bT.symbol, bT.name);
        const bTokenAmount = TokenAmount.fromHumanAmount(bToken, bT.balance);
        const bptToken = new BPT(bToken, bTokenAmount.amount, bT.index);

        const params: Params = {
            fee: swapFee,
            rate: wTRate,
            lowerTarget: lowerTarget.scale18,
            upperTarget: upperTarget.scale18,
        };

        return new LinearPool(pool.id, pool.poolTypeVersion, params, mainToken, wrappedToken, bptToken);
    }

    constructor(
        id: Hex,
        poolTypeVersion: number,
        params: Params,
        mainToken: StablePoolToken,
        wrappedToken: StablePoolToken,
        bptToken: BPT,
    ) {
        this.chainId = mainToken.token.chain;
        this.id = id;
        this.poolTypeVersion = poolTypeVersion;
        this.swapFee = params.fee;
        this.mainToken = mainToken;
        this.wrappedToken = wrappedToken;
        this.bptToken = bptToken;
        this.address = getPoolAddress(id);
        this.params = params;

        this.tokens = [this.mainToken, this.wrappedToken, this.bptToken];
        this.tokenMap = new Map(this.tokens.map((token) => [token.token.address, token]));
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');
        // TODO: Fix linear normalized liquidity calc
        return tOut.amount;
    }

    public swapGivenIn(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        let _swapAmount = swapAmount;

        let output: TokenAmount;
        if (tokenIn.isEqual(this.mainToken.token)) {
            if (tokenOut.isEqual(this.wrappedToken.token)) {
                output = this._exactMainTokenInForWrappedOut(_swapAmount);
                output = output.divDownFixed(this.wrappedToken.rate);
            } else {
                output = this._exactMainTokenInForBptOut(_swapAmount);
            }
        } else if (tokenIn.isEqual(this.wrappedToken.token)) {
            _swapAmount = _swapAmount.mulDownFixed(this.wrappedToken.rate);
            if (tokenOut.isEqual(this.mainToken.token)) {
                output = this._exactWrappedTokenInForMainOut(_swapAmount);
            } else {
                output = this._exactWrappedTokenInForBptOut(_swapAmount);
            }
        } else if (tokenIn.isEqual(this.bptToken.token)) {
            if (tokenOut.isEqual(this.mainToken.token)) {
                output = this._exactBptInForMainOut(_swapAmount);
            } else {
                output = this._exactBptInForWrappedOut(_swapAmount);
                output = output.divDownFixed(this.wrappedToken.rate);
            }
        } else {
            throw new Error('Pool does not contain the tokens provided');
        }

        if (output.amount > (tOut?.amount || 0n)) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        if (output.amount < 0n) throw new Error('Swap amount is negative');

        if (mutateBalances) {
            tIn.increase(_swapAmount.amount);
            tOut.decrease(output.amount);
        }

        return output;
    }

    public swapGivenOut(
        tokenIn: Token,
        tokenOut: Token,
        swapAmount: TokenAmount,
        mutateBalances?: boolean,
    ): TokenAmount {
        const { tIn, tOut } = this.getRequiredTokenPair(tokenIn, tokenOut);

        if (swapAmount.amount > (tOut?.amount || 0n)) {
            throw new Error('Swap amount exceeds the pool limit');
        }

        let _swapAmount = swapAmount;

        let input: TokenAmount;
        if (tokenIn.isEqual(this.mainToken.token)) {
            if (tokenOut.isEqual(this.wrappedToken.token)) {
                _swapAmount = _swapAmount.mulDownFixed(this.wrappedToken.rate);
                input = this._mainTokenInForExactWrappedOut(_swapAmount);
            } else {
                input = this._mainTokenInForExactBptOut(_swapAmount);
            }
        } else if (tokenIn.isEqual(this.wrappedToken.token)) {
            if (tokenOut.isEqual(this.mainToken.token)) {
                input = this._wrappedTokenInForExactMainOut(_swapAmount);
            } else {
                input = this._wrappedTokenInForExactBptOut(_swapAmount);
            }
            input = input.mulDownFixed(this.wrappedToken.rate);
        } else if (tokenIn.isEqual(this.bptToken.token)) {
            if (tokenOut.isEqual(this.mainToken.token)) {
                input = this._bptInForExactMainOut(_swapAmount);
            } else {
                _swapAmount = _swapAmount.mulDownFixed(this.wrappedToken.rate);
                input = this._bptInForExactWrappedOut(_swapAmount);
            }
        } else {
            throw new Error('Pool does not contain the tokens provided');
        }

        if (input.amount < 0n) throw new Error('Swap amount is negative');

        if (mutateBalances) {
            tIn.increase(input.amount);
            tOut.decrease(_swapAmount.amount);
        }

        return input;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) throw new Error('Pool does not contain the tokens provided');

        if (swapKind === SwapKind.GivenIn) {
            if (tokenOut.isEqual(this.bptToken.token)) {
                // Swapping to BPT allows for a very large amount so using pre-minted amount as estimation
                return MAX_TOKEN_BALANCE;
            }
            const amount = TokenAmount.fromRawAmount(tokenOut, tOut.amount);

            return this.swapGivenOut(tokenIn, tokenOut, amount).amount;
        }
        if (tokenOut.isEqual(this.bptToken.token)) {
            return (tOut.amount * MAX_RATIO) / WAD;
        }
        return tOut.amount;
    }

    private _exactMainTokenInForWrappedOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcWrappedOutPerMainIn(swapAmount.scale18, this.mainToken.scale18, this.params);

        return TokenAmount.fromScale18Amount(this.wrappedToken.token, tokenOutScale18);
    }

    private _exactMainTokenInForBptOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcBptOutPerMainIn(
            swapAmount.scale18,
            this.mainToken.scale18,
            this.wrappedToken.scale18,
            this.bptToken.virtualBalance,
            this.params,
        );

        return TokenAmount.fromScale18Amount(this.bptToken.token, tokenOutScale18);
    }

    private _exactWrappedTokenInForMainOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcMainOutPerWrappedIn(swapAmount.scale18, this.mainToken.scale18, this.params);

        return TokenAmount.fromScale18Amount(this.mainToken.token, tokenOutScale18);
    }

    private _exactWrappedTokenInForBptOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcBptOutPerWrappedIn(
            swapAmount.scale18,
            this.mainToken.scale18,
            this.wrappedToken.scale18,
            this.bptToken.virtualBalance,
            this.params,
        );

        return TokenAmount.fromScale18Amount(this.bptToken.token, tokenOutScale18);
    }

    private _exactBptInForMainOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcMainOutPerBptIn(
            swapAmount.scale18,
            this.mainToken.scale18,
            this.wrappedToken.scale18,
            this.bptToken.virtualBalance,
            this.params,
        );

        return TokenAmount.fromScale18Amount(this.mainToken.token, tokenOutScale18);
    }

    private _exactBptInForWrappedOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcWrappedOutPerBptIn(
            swapAmount.scale18,
            this.mainToken.scale18,
            this.wrappedToken.scale18,
            this.bptToken.virtualBalance,
            this.params,
        );

        return TokenAmount.fromScale18Amount(this.wrappedToken.token, tokenOutScale18);
    }

    private _mainTokenInForExactWrappedOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcMainInPerWrappedOut(swapAmount.scale18, this.mainToken.scale18, this.params);

        return TokenAmount.fromScale18Amount(this.mainToken.token, tokenOutScale18, true);
    }

    private _mainTokenInForExactBptOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcMainInPerBptOut(
            swapAmount.scale18,
            this.mainToken.scale18,
            this.wrappedToken.scale18,
            this.bptToken.virtualBalance,
            this.params,
        );

        return TokenAmount.fromScale18Amount(this.mainToken.token, tokenOutScale18, true);
    }

    private _wrappedTokenInForExactMainOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcWrappedInPerMainOut(swapAmount.scale18, this.mainToken.scale18, this.params);

        return TokenAmount.fromScale18Amount(this.wrappedToken.token, tokenOutScale18, true);
    }

    private _wrappedTokenInForExactBptOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcWrappedInPerBptOut(
            swapAmount.scale18,
            this.mainToken.scale18,
            this.wrappedToken.scale18,
            this.bptToken.virtualBalance,
            this.params,
        );

        return TokenAmount.fromScale18Amount(this.wrappedToken.token, tokenOutScale18, true);
    }

    private _bptInForExactMainOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcBptInPerMainOut(
            swapAmount.scale18,
            this.mainToken.scale18,
            this.wrappedToken.scale18,
            this.bptToken.virtualBalance,
            this.params,
        );

        return TokenAmount.fromScale18Amount(this.bptToken.token, tokenOutScale18, true);
    }

    private _bptInForExactWrappedOut(swapAmount: TokenAmount): TokenAmount {
        const tokenOutScale18 = _calcBptInPerWrappedOut(
            swapAmount.scale18,
            this.mainToken.scale18,
            this.wrappedToken.scale18,
            this.bptToken.virtualBalance,
            this.params,
        );

        return TokenAmount.fromScale18Amount(this.bptToken.token, tokenOutScale18, true);
    }

    private getRequiredTokenPair(tokenIn: Token, tokenOut: Token): { tIn: LinearPoolToken; tOut: LinearPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
