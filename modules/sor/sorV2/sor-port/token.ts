import { Chain } from '@prisma/client';

export class Token {
    public readonly chain: Chain;
    public readonly address: string;
    public readonly decimals: number;
    public readonly symbol?: string;
    public readonly name?: string;
    public readonly wrapped: string;

    public constructor(
        chain: Chain,
        address: string,
        decimals: number,
        symbol?: string,
        name?: string,
        wrapped?: string,
    ) {
        this.chain = chain;
        // Addresses are always lowercased for speed
        this.address = address.toLowerCase();
        this.decimals = decimals;
        this.symbol = symbol;
        this.name = name;
        this.wrapped = wrapped ? wrapped.toLowerCase() : address.toLowerCase();
    }

    public isEqual(token: Token) {
        return this.chain === token.chain && this.address === token.address;
    }

    public isUnderlyingEqual(token: Token) {
        return this.chain === token.chain && this.wrapped === token.wrapped;
    }
}
