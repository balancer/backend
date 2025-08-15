import { Chain } from '@prisma/client';
import { SwapEvent } from '../../prisma/prisma-types';

export interface TokenPriceData {
    address: string;
    chain: Chain;
    coingeckoTokenId?: string;
    excludedFromCoingecko?: boolean;
    types: string[];
    underlyingTokenAddress?: string;
    unwrapRate?: string;
    underlyingTokenPrice?: number;
    currentPrice?: number;
    latestSwaps?: SwapEvent[];
    pricedBy?: string;
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
     * @param allPrices Complete map of all available token prices (address -> price)
     * @returns Array of price items ready to be saved
     */
    calculatePricesForTokens(
        tokens: TokenPriceData[],
        allPrices?: Map<string, { price: number; updatedBy: string }>,
    ): Promise<PriceItem[]>;

    /**
     * Get the name of this price handler
     */
    id: string;

    /**
     * Whether the pricing pipeline should exit if this handler fails
     */
    readonly exitIfFails: boolean;
}
