import { PrismaTokenWithTypes } from '../../prisma/prisma-types';
import { Chain } from '@prisma/client';

export interface TokenPriceHandler {
    exitIfFails: boolean;
    id: string;

    /**
     * Updates prices for the provided tokens, returning an array of the tokens
     * actually updated.
     * @param tokens tokens needing prices
     */
    updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<PrismaTokenWithTypes[]>;
}

export interface TokenDefinition {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    chainId: number;
    chain: Chain;
    logoURI?: string | null;
    priority: number;
    coingeckoPlatformId?: string | null;
    coingeckoContractAddress?: string | null;
    coingeckoTokenId?: string | null;
    tradable: boolean;
}

export interface TokenPriceItem {
    id: string;
    timestamp: number;
    price: number;
}
