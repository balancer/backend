import { Chain } from '@prisma/client';

export interface TokenPriceData {
    address: string;
    chain: Chain;
    coingeckoTokenId?: string;
    excludedFromCoingecko?: boolean;
    types: string[];
    underlyingTokenAddress?: string;
    unwrapRate?: string;
    underlyingTokenPrice?: number;
}

export interface PriceItem {
    address: string;
    chain: Chain;
    price: number;
    updatedAt: Date;
    updatedBy: string;
}

export interface PriceHandler {
    /**
     * Calculate prices for the given tokens
     * @param tokens Array of tokens to calculate prices for
     * @returns Array of price items ready to be saved
     */
    calculatePricesForTokens(tokens: TokenPriceData[]): Promise<PriceItem[]>;

    /**
     * Get the name of this price handler
     */
    id: string;

    /**
     * Whether the pricing pipeline should exit if this handler fails
     */
    readonly exitIfFails: boolean;
}
