import { Chain } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';
import { gql, request } from 'graphql-request';

const url = 'https://blue-api.morpho.org/graphql';
const query = gql`
    {
        vaults(first: 1000, where: { totalAssetsUsd_gte: 0.01 }) {
            items {
                address
                chain {
                    network
                }
                state {
                    sharePriceUsd
                }
            }
        }
    }
`;

export type Vault = {
    address: string;
    chain: {
        network: 'ethereum' | 'base';
    };
    state: {
        sharePriceUsd: number;
    };
};

export type BlueApiResponse = {
    vaults: {
        items: Vault[];
    };
};

export interface IMorphoBlueApiClient {
    getVaults(): Promise<BlueApiResponse>;
}

export class MorphoBlueApiClient implements IMorphoBlueApiClient {
    async getVaults(): Promise<BlueApiResponse> {
        return await request<BlueApiResponse>(url, query);
    }
}

export class MorphoPriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'MorphoPriceHandlerService';

    constructor(private apiClient: IMorphoBlueApiClient = new MorphoBlueApiClient()) {}

    async calculatePricesForTokens(tokens: TokenPriceData[]): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        try {
            // Fetch vault data from Morpho API
            const {
                vaults: { items },
            } = await this.apiClient.getVaults();

            const priceItems: PriceItem[] = [];
            const addresses = acceptedTokens.map((token) => token.address);

            // Match tokens with vault data
            const morphoVaults = items.filter((vault) => addresses.includes(vault.address.toLowerCase()));

            for (const vault of morphoVaults) {
                const tokenData = acceptedTokens.find((token) => token.address === vault.address.toLowerCase());
                if (!tokenData) continue;

                const chain = vault.chain.network === 'ethereum' ? Chain.MAINNET : Chain.BASE;

                // Only include if token is on the correct chain
                if (tokenData.chain === chain) {
                    priceItems.push({
                        address: vault.address.toLowerCase(),
                        chain,
                        price: vault.state.sharePriceUsd,
                        updatedAt: new Date(),
                        updatedBy: this.id,
                    });
                }
            }

            return priceItems;
        } catch (error) {
            console.error('MorphoPriceHandler: Error fetching vault data:', error);
            return [];
        }
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        // Accept tokens that might be Morpho vault tokens (no specific filtering criteria provided)
        // This will be determined by the API response
        return tokens.filter((token) => token.chain === Chain.MAINNET || token.chain === Chain.BASE);
    }
}
