import { Chain } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';
import { formatUnits } from 'viem';
import { IViemClient } from '../../sources/viem-client';
import CLQDRPerpetualEscrowTokenRateProviderAbi from '../../token/abi/CLQDRPerpetualEscrowTokenRateProvider.json';

export class ClqdrPriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'ClqdrPriceHandlerService';

    private readonly clqdrAddress = '0x814c66594a22404e101fecfecac1012d8d75c156';
    private readonly lqdrAddress = '0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9';
    private readonly clqdrPriceRateProviderAddress = '0x1a148871bf262451f34f13cbcb7917b4fe59cb32';

    constructor(private getViemClient: (chain: Chain) => IViemClient) {}

    async calculatePricesForTokens(tokens: TokenPriceData[], allPrices: Map<string, number>): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        try {
            // Get LQDR price from allPrices map
            const lqdrPrice = allPrices.get(this.lqdrAddress);
            if (!lqdrPrice) {
                console.error('ClqdrPriceHandler: LQDR price not found in allPrices');
                return [];
            }

            // Get CLQDR rate from on-chain contract
            const clqdrRate = await this.getClqdrRate();
            if (!clqdrRate) {
                console.error('ClqdrPriceHandler: Could not get CLQDR rate from on-chain');
                return [];
            }

            // Calculate CLQDR price
            const clqdrPrice = lqdrPrice * clqdrRate;

            // Create price items for all accepted tokens
            const priceItems: PriceItem[] = acceptedTokens.map((token) => ({
                address: token.address,
                chain: token.chain,
                price: clqdrPrice,
                updatedAt: new Date(),
                updatedBy: this.id,
            }));

            return priceItems;
        } catch (error) {
            console.error('ClqdrPriceHandler: Error calculating prices:', error);
            return [];
        }
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        return tokens.filter((token) => token.chain === Chain.FANTOM && token.address === this.clqdrAddress);
    }

    private async getClqdrRate(): Promise<number | null> {
        try {
            const viemClient = this.getViemClient(Chain.FANTOM);
            const rate = (await viemClient.readContract({
                address: this.clqdrPriceRateProviderAddress as `0x${string}`,
                abi: CLQDRPerpetualEscrowTokenRateProviderAbi,
                functionName: 'getRate',
            })) as bigint;

            // Convert from 18 decimal rate to float
            const rateFloat = parseFloat(formatUnits(rate, 18));
            return rateFloat > 0 ? rateFloat : null;
        } catch (error) {
            // Handle viem client errors silently - they're expected in test environments
            // and when the contract is unavailable
            return null;
        }
    }
}
