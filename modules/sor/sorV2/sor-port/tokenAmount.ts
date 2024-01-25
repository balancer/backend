import _Decimal from 'decimal.js-light';
import { parseUnits } from 'viem';
import { Token } from './token';
import { DECIMAL_SCALES } from './constants';
import { WAD } from './utils/math';
import { InputAmount } from './types';

export type BigintIsh = bigint | string | number;

export class TokenAmount {
    public readonly token: Token;
    public readonly scalar: bigint;
    public readonly decimalScale: bigint;
    public amount: bigint;
    public scale18: bigint;

    public static fromRawAmount(token: Token, rawAmount: BigintIsh) {
        return new TokenAmount(token, rawAmount);
    }

    public static fromHumanAmount(token: Token, humanAmount: `${number}`) {
        const rawAmount = parseUnits(humanAmount, token.decimals);
        return new TokenAmount(token, rawAmount);
    }

    public static fromScale18Amount(token: Token, scale18Amount: BigintIsh, divUp?: boolean) {
        const scalar = DECIMAL_SCALES[18 - token.decimals];
        const rawAmount = divUp ? 1n + (BigInt(scale18Amount) - 1n) / scalar : BigInt(scale18Amount) / scalar;
        return new TokenAmount(token, rawAmount);
    }

    protected constructor(token: Token, amount: BigintIsh) {
        this.decimalScale = DECIMAL_SCALES[token.decimals];
        this.token = token;
        this.amount = BigInt(amount);
        this.scalar = DECIMAL_SCALES[18 - token.decimals];
        this.scale18 = this.amount * this.scalar;
    }

    public add(other: TokenAmount): TokenAmount {
        return new TokenAmount(this.token, this.amount + other.amount);
    }

    public sub(other: TokenAmount): TokenAmount {
        return new TokenAmount(this.token, this.amount - other.amount);
    }

    public mulUpFixed(other: bigint): TokenAmount {
        const product = this.amount * other;
        const multiplied = (product - 1n) / WAD + 1n;
        return new TokenAmount(this.token, multiplied);
    }

    public mulDownFixed(other: bigint): TokenAmount {
        const multiplied = (this.amount * other) / WAD;
        return new TokenAmount(this.token, multiplied);
    }

    public divUpFixed(other: bigint): TokenAmount {
        const divided = (this.amount * WAD + other - 1n) / other;
        return new TokenAmount(this.token, divided);
    }

    public divDownFixed(other: bigint): TokenAmount {
        const divided = (this.amount * WAD) / other;
        return new TokenAmount(this.token, divided);
    }

    public toSignificant(significantDigits = 6): string {
        return new _Decimal(this.amount.toString())
            .div(new _Decimal(this.decimalScale.toString()))
            .toDecimalPlaces(significantDigits)
            .toString();
    }

    public toInputAmount(): InputAmount {
        return {
            address: this.token.address,
            decimals: this.token.decimals,
            rawAmount: this.amount,
        };
    }
}
