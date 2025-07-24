import { PriceHandler, TokenPriceData, PriceItem } from '../types';
import _ from 'lodash';

export class ERC4626PriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'ERC4626PriceHandlerService';

    async calculatePricesForTokens(tokens: TokenPriceData[]): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        const priceItems: PriceItem[] = [];

        // Group tokens by chain
        const tokensByChain = _.groupBy(acceptedTokens, 'chain');

        for (const chain in tokensByChain) {
            const erc4626TokensForChain = tokensByChain[chain];
            if (!erc4626TokensForChain.length) {
                continue;
            }

            for (const erc4626Token of erc4626TokensForChain) {
                const underlying = erc4626Token.underlyingTokenAddress;
                if (!underlying) {
                    // Missing underlying token address
                    continue;
                }

                if (!erc4626Token.underlyingTokenPrice) {
                    // Missing underlying price, skip
                    continue;
                }

                try {
                    const unwrapRate = Number(erc4626Token.unwrapRate || '1');
                    const underlyingPrice = erc4626Token.underlyingTokenPrice;
                    const price = Number((unwrapRate * underlyingPrice).toFixed(20));

                    priceItems.push({
                        address: erc4626Token.address,
                        chain: erc4626Token.chain,
                        price,
                        updatedAt: new Date(),
                        updatedBy: this.id,
                    });
                } catch (e: any) {
                    console.error('ERC4626 price failed for', erc4626Token.address, chain, e.message);
                }
            }
        }

        return priceItems;
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        return tokens.filter((token) => token.types.includes('ERC4626'));
    }
}
