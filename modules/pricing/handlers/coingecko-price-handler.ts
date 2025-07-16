import { Chain } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';
import { coingeckoDataService } from '../../token/lib/coingecko-data.service';
import _ from 'lodash';

interface CoingeckoConfig {
    excludedTokenAddresses: { address: string; chain: Chain }[];
}

export class CoingeckoPriceHandler implements PriceHandler {
    public readonly exitIfFails = true;
    public readonly id = 'CoingeckoPriceHandlerService';

    constructor(private readonly config: CoingeckoConfig) {}

    async calculatePricesForTokens(tokens: TokenPriceData[]): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        const priceItems: PriceItem[] = [];
        const uniqueTokensWithIds = _.uniqBy(acceptedTokens, 'coingeckoTokenId');
        const chunks = _.chunk(uniqueTokensWithIds, 250); // max page size is 250

        for (const chunk of chunks) {
            const response = await coingeckoDataService.getMarketDataForTokenIds(
                chunk.map((item) => item.coingeckoTokenId || ''),
            );

            for (const item of response) {
                const tokensToUpdate = acceptedTokens.filter((token) => token.coingeckoTokenId === item.id);

                for (const tokenToUpdate of tokensToUpdate) {
                    if (item.current_price) {
                        priceItems.push({
                            address: tokenToUpdate.address,
                            chain: tokenToUpdate.chain,
                            price: Number(item.current_price),
                            updatedAt: new Date(item.last_updated),
                            updatedBy: this.id,
                        });
                    }
                }
            }
        }

        return priceItems;
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        return tokens.filter(
            (token) =>
                !this.config.excludedTokenAddresses.find(
                    (excluded) => excluded.address === token.address && excluded.chain === token.chain,
                ) &&
                !token.excludedFromCoingecko &&
                token.coingeckoTokenId,
        );
    }
}
