import { Address } from 'viem';
import { InputToken } from './types';
export class Token {
    public readonly chainId: number;
    public readonly address: Address;
    public readonly decimals: number;
    public readonly symbol?: string;
    public readonly name?: string;
    public readonly wrapped: Address;

    public constructor(
        chainId: number,
        address: Address,
        decimals: number,
        symbol?: string,
        name?: string,
        wrapped?: Address,
    ) {
        this.chainId = chainId;
        // Addresses are always lowercased for speed
        this.address = address.toLowerCase() as Address;
        this.decimals = decimals;
        this.symbol = symbol;
        this.name = name;
        this.wrapped = (wrapped ? wrapped.toLowerCase() : address.toLowerCase()) as Address;
    }

    public isEqual(token: Token) {
        return this.chainId === token.chainId && this.address === token.address;
    }

    public isUnderlyingEqual(token: Token) {
        return this.chainId === token.chainId && this.wrapped === token.wrapped;
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
