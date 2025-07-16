import { PriceHandler, TokenPriceData, PriceItem } from '../types';

const LQDR = '0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9';

export class RektTokensHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'RektTokensHandlerService';

    async calculatePricesForTokens(tokens: TokenPriceData[], allPrices: Map<string, number>): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        return acceptedTokens.map((token) => ({
            address: token.address,
            chain: token.chain,
            price: 0,
            updatedAt: new Date(),
            updatedBy: this.id,
        }));
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        return tokens.filter((token) => token.address === LQDR);
    }
}
