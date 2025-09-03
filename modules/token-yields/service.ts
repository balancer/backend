import { Chain } from '@prisma/client';
import { TokenYieldRepository } from './repository';
import { TokenYieldAprHandlers } from './handlers';
import { TokenYieldConfig, TokenApr } from './types';

export class TokenYieldsService {
    constructor(private tokenYieldRepository = new TokenYieldRepository()) {}

    /**
     * Fetch yields from external sources and store them in the database
     */
    async fetchAndStoreYields(aprConfig: TokenYieldConfig, chain: Chain): Promise<void> {
        const tokenYieldAprHandlers = new TokenYieldAprHandlers(aprConfig, chain);

        try {
            console.log(`Fetching yields for chain ${chain}...`);

            // Fetch APRs/yield from all handlers
            const tokenAprs = await tokenYieldAprHandlers.fetchAprsFromAllHandlers();

            if (tokenAprs.length === 0) {
                console.log(`No token yields fetched for chain ${chain}`);
                return;
            }

            console.log(`Fetched ${tokenAprs.length} token yields for chain ${chain}`);

            // Group by source (we'll need to track which handler provided which data)
            await this.tokenYieldRepository.storeTokenYields(chain, tokenAprs);

            console.log(`Successfully stored ${tokenAprs.length} token yields for chain ${chain}`);
        } catch (error) {
            throw `Failed to fetch and store yields for chain ${chain}: ${error}`;
        }
    }

    /**
     * Get stored token yields from database
     */
    async getTokenYields(chain: Chain): Promise<Map<string, TokenApr>> {
        const tokens = await this.tokenYieldRepository.getTokenYields(chain);

        return new Map<string, TokenApr>(
            tokens.filter((token) => !isNaN(token.apr)).map((token) => [token.address, token]),
        );
    }
}
