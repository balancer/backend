import { Chain } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';
import { parseAbiItem } from 'abitype';
import config from '../../../config';
import _ from 'lodash';
import { IViemClient } from '../../sources/viem-client';

interface AaveTokenConfig {
    wrappedToken: string;
    aToken: string;
    underlying: string;
    chain: Chain;
}

interface ContractRate {
    address: string;
    rate: bigint;
}

export class AavePriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'AavePriceHandlerService';
    private aaveTokensByChain: Record<string, AaveTokenConfig[]>;

    constructor(private getViemClient: (chain: Chain) => IViemClient) {
        this.aaveTokensByChain = this.fetchAaveTokensFromConfig();
    }

    async calculatePricesForTokens(tokens: TokenPriceData[], allPrices: Map<string, number>): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        const priceItems: PriceItem[] = [];

        // Group tokens by chain
        const tokensByChain = _.groupBy(acceptedTokens, 'chain');

        for (const chain in tokensByChain) {
            const tokensForChain = tokensByChain[chain];
            const aaveTokensForChain =
                this.aaveTokensByChain[chain]?.filter((aaveToken) =>
                    tokensForChain.some((t) => t.address === aaveToken.wrappedToken),
                ) || [];

            if (aaveTokensForChain.length === 0) {
                continue;
            }

            try {
                // Get contract rates for this chain
                const contractRates = await this.getContractRatesForChain(
                    tokensForChain,
                    aaveTokensForChain,
                    chain as Chain,
                );

                // Create rate map combining contract rates and ERC4626 rates
                const rateMap = this.createRateMap(
                    contractRates,
                    tokensForChain.filter((token) => token.types.includes('ERC4626')),
                );

                // Calculate prices for each Aave token
                for (const aaveToken of aaveTokensForChain) {
                    // Find the token data to get underlying price
                    const tokenData = tokensForChain.find((t) => t.address === aaveToken.wrappedToken);
                    if (!tokenData?.underlyingTokenPrice) {
                        console.error(
                            `AavePriceHandler: Underlying price for ${aaveToken.wrappedToken} on ${chain} not found`,
                        );
                        continue;
                    }

                    const rate = rateMap[aaveToken.wrappedToken];
                    if (rate === undefined) {
                        console.error(`AavePriceHandler: Rate for ${aaveToken.wrappedToken} on ${chain} not found`);
                        continue;
                    }

                    try {
                        const price = Number((rate * tokenData.underlyingTokenPrice).toFixed(2));

                        priceItems.push({
                            address: aaveToken.wrappedToken,
                            chain: aaveToken.chain,
                            price,
                            updatedAt: new Date(),
                            updatedBy: this.id,
                        });
                    } catch (e: any) {
                        console.error('Aave price failed for', aaveToken.wrappedToken, chain, e.message);
                    }
                }
            } catch (e: any) {
                console.error('Aave price calculation failed for chain', chain, e.message);
            }
        }

        return priceItems;
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        const allAaveTokenAddresses = Object.values(this.aaveTokensByChain)
            .flat()
            .map((token) => token.wrappedToken);
        return tokens.filter((token) => allAaveTokenAddresses.includes(token.address));
    }

    /**
     * Fetches Aave token configuration from the global config and groups by chain
     * Isolated function for Aave token discovery
     */
    private fetchAaveTokensFromConfig(): Record<string, AaveTokenConfig[]> {
        const aaveTokens = Object.keys(config).flatMap((chain) => {
            const chainConfig = config[chain as keyof typeof config];
            const v3 = chainConfig.aprHandlers.ybAprHandler?.aave?.v3?.tokens;
            if (!v3) return [];

            return Object.values(v3).flatMap(({ aTokenAddress, underlyingAssetAddress, wrappedTokens }) =>
                Object.values(wrappedTokens).map((wrappedToken) => ({
                    wrappedToken,
                    aToken: aTokenAddress,
                    underlying: underlyingAssetAddress,
                    chain: chain as Chain,
                })),
            );
        });

        return _.groupBy(aaveTokens, 'chain');
    }

    /**
     * Gets contract rates for a specific chain by filtering and fetching external data
     * Isolated function that handles the logic for determining which tokens need contract calls
     */
    private async getContractRatesForChain(
        tokensForChain: TokenPriceData[],
        aaveTokensForChain: AaveTokenConfig[],
        chain: Chain,
    ): Promise<ContractRate[]> {
        // Identify ERC4626 tokens that don't need contract calls
        const erc4626Addresses = tokensForChain
            .filter((token) => token.types.includes('ERC4626'))
            .map((token) => token.address);

        // Filter to only Aave tokens that need contract rate calls
        const contractAddresses = aaveTokensForChain
            .map((token) => token.wrappedToken)
            .filter((address) => !erc4626Addresses.includes(address));

        // Fetch rates from contracts
        return this.fetchContractRates(contractAddresses, chain);
    }

    /**
     * Fetches rates from smart contracts using multicall
     * Isolated function for external contract data fetching
     */
    private async fetchContractRates(addresses: string[], chain: Chain): Promise<ContractRate[]> {
        if (addresses.length === 0) {
            return [];
        }

        const contracts = addresses.map((address) => ({
            address: address as `0x${string}`,
            // Returns rates for the rebasing tokens returned in RAYs (27 decimals)
            abi: [parseAbiItem('function rate() view returns (uint256)')],
            functionName: 'rate',
        }));

        const rates = await this.getViemClient(chain)
            .multicall({ contracts, allowFailure: true })
            .then((res) => res.map((r) => (r.status === 'success' ? r.result : 1000000000000000000000000000n)));

        return addresses.map((address, index) => ({
            address,
            rate: rates[index],
        }));
    }

    /**
     * Creates a unified rate map from contract rates and ERC4626 rates
     */
    private createRateMap(contractRates: ContractRate[], erc4626Tokens: TokenPriceData[]): Record<string, number> {
        const contractRateMap = _.zipObject(
            contractRates.map((r) => r.address),
            contractRates.map((r) => Number(r.rate) / 1e27), // Convert from RAY to decimal
        );

        const erc4626RateMap = _.zipObject(
            erc4626Tokens.map((t) => t.address),
            erc4626Tokens.map((t) => Number(t.unwrapRate || '1')),
        );

        return { ...contractRateMap, ...erc4626RateMap };
    }
}
