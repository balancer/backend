import { Address } from 'viem';
import { InputToken } from '../types';
import { Chain } from '@prisma/client';
export class Token {
    public readonly address: Address;
    public readonly decimals: number;
    public readonly symbol?: string;
    public readonly name?: string;
    public readonly wrapped: Address;

    public constructor(address: Address, decimals: number, symbol?: string, name?: string, wrapped?: Address) {
        // Addresses are always lowercased for speed
        this.address = address.toLowerCase() as Address;
        this.decimals = decimals;
        this.symbol = symbol;
        this.name = name;
        this.wrapped = (wrapped ? wrapped.toLowerCase() : address.toLowerCase()) as Address;
    }

    public isEqual(token: Token) {
        return this.address === token.address;
    }

    public isUnderlyingEqual(token: Token) {
        return this.wrapped === token.wrapped;
    }

    public isSameAddress(address: Address) {
        return this.address === address.toLowerCase();
    }

    public toInputToken(): InputToken {
        return {
            address: this.address,
            decimals: this.decimals,
        };
    }
}
