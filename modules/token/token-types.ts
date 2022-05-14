import { PrismaTokenWithTypes } from '../../prisma/prisma-types';

export interface TokenPriceHandler {
    exitIfFails: boolean;
    id: string;

    /**
     * Determines what tokens this price handler is capable of fetching a price for
     * @param tokens tokens needing prices
     */
    getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]>;

    /**
     * Updates prices for the provided tokens, returning an array of addresses of the tokens
     * actually updated.
     * @param tokens tokens needing prices
     */
    updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]>;
}

export interface TokenDefinition {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    chainId: number;
    logoURI?: string | null;
    priority: number;
    coingeckoPlatformId?: string | null;
    coingeckoContractAddress?: string | null;
    coingeckoTokenId?: string | null;
    tradable: boolean;
}
