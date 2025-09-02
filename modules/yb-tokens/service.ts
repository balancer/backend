import { Chain } from '@prisma/client';
import { YbTokenRepository } from './repository';
import { YbAprHandlers } from './handlers';
import { YbAprConfig, TokenApr } from './types';

export class YbTokensService {
    constructor(private ybTokenRepository = new YbTokenRepository()) {}

    /**
     * Fetch yields from external sources and store them in the database
     */
    async fetchAndStoreYields(aprConfig: YbAprConfig, chain: Chain): Promise<void> {
        const ybAprHandlers = new YbAprHandlers(aprConfig, chain);

        try {
            console.log(`Fetching yields for chain ${chain}...`);

            // Fetch APRs from all handlers
            const tokenAprs = await ybAprHandlers.fetchAprsFromAllHandlers();

            if (tokenAprs.length === 0) {
                console.log(`No token yields fetched for chain ${chain}`);
                return;
            }

            console.log(`Fetched ${tokenAprs.length} token yields for chain ${chain}`);

            // Group by source (we'll need to track which handler provided which data)
            // For now, we'll store all as 'yb-handlers' source
            await this.ybTokenRepository.storeTokens(chain, tokenAprs);

            console.log(`Successfully stored ${tokenAprs.length} token yields for chain ${chain}`);
        } catch (error) {
            throw `Failed to fetch and store yields for chain ${chain}: ${error}`;
        }
    }

    /**
     * Get stored token yields from database
     */
    async getYbTokens(chain: Chain): Promise<Map<string, TokenApr>> {
        const tokens = await this.ybTokenRepository.getTokens(chain);

        return new Map<string, TokenApr>(
            tokens.filter((token) => !isNaN(token.apr)).map((token) => [token.address, token]),
        );
    }
}
