import { Chain } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';
import { SwapKind, BatchSwapStep } from '@balancer/sdk';
import { fp } from '../../big-number/big-number';
import { zeroAddress as AddressZero } from 'viem';
import { formatFixed } from '@ethersproject/bignumber';
import { IViemClient } from '../../sources/viem-client';
import VaultAbi from '../../pool/abi/Vault.json';

type FundManagement = {
    sender: string;
    recipient: string;
    fromInternalBalance: boolean;
    toInternalBalance: boolean;
};

export class BeetsPriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'BeetsPriceHandlerService';

    private readonly beetsFtmAddress = '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e';
    private readonly beetsSonicAddress = '0x2d0e0814e62d80056181f5cd932274405966e4f0';
    private readonly beetsOptimismAddress = '0xb4bc46bc6cb217b59ea8f4530bae26bf69f677f0';
    private readonly stSAddress = '0xe5da20f15420ad15de0fa650600afc998bbe3955';
    private readonly freshBeetsPoolId = '0x10ac2f9dae6539e77e372adb14b1bf8fbd16b3e8000200000000000000000005';
    private readonly VaultSonicAddress = '0xba12222222228d8ba445958a75a0704d566bf2c8';

    constructor(private getViemClient: (chain: Chain) => IViemClient) {}

    async calculatePricesForTokens(
        tokens: TokenPriceData[],
        allPrices: Map<string, { price: number; updatedBy: string }>,
    ): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        try {
            // Get stS token price from allPrices map
            const stSPrice = allPrices.get(this.stSAddress);
            if (!stSPrice) {
                console.error('BeetsPriceHandler: stS token price not found in allPrices');
                return [];
            }

            // Perform batch swap query to get BEETS price
            const beetsPrice = await this.getBeetsPriceFromSwap(stSPrice.price);
            if (!beetsPrice) {
                console.error('BeetsPriceHandler: Could not get BEETS price from swap');
                return [];
            }

            // Create price items for all accepted tokens
            const priceItems: PriceItem[] = acceptedTokens.map((token) => ({
                address: token.address,
                chain: token.chain,
                price: beetsPrice,
                updatedAt: new Date(),
                updatedBy: this.id,
            }));

            return priceItems;
        } catch (error) {
            console.error('BeetsPriceHandler: Error calculating prices:', error);
            return [];
        }
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        return tokens.filter(
            (token) =>
                (token.chain === Chain.FANTOM && token.address === this.beetsFtmAddress) ||
                (token.chain === Chain.OPTIMISM && token.address === this.beetsOptimismAddress) ||
                (token.chain === Chain.SONIC && token.address === this.beetsSonicAddress),
        );
    }

    private async getBeetsPriceFromSwap(stSPrice: number): Promise<number | null> {
        try {
            const assets: string[] = [this.beetsSonicAddress, this.stSAddress];
            const swaps: BatchSwapStep[] = [
                {
                    poolId: this.freshBeetsPoolId,
                    assetInIndex: 0n,
                    assetOutIndex: 1n,
                    amount: fp(1).toBigInt(),
                    userData: '0x',
                },
            ];

            const funds: FundManagement = {
                sender: AddressZero,
                recipient: AddressZero,
                fromInternalBalance: false,
                toInternalBalance: false,
            };

            const viemClient = this.getViemClient(Chain.SONIC);
            const deltas = (await viemClient.readContract({
                address: this.VaultSonicAddress as `0x${string}`,
                abi: VaultAbi,
                functionName: 'queryBatchSwap',
                args: [SwapKind.GivenIn, swaps, assets, funds],
            })) as bigint[];

            const tokenOutAmountScaled = deltas[assets.indexOf(this.stSAddress)] ?? 0n;

            if (tokenOutAmountScaled === 0n) {
                return null;
            }

            const beetsPrice = stSPrice * Math.abs(parseFloat(formatFixed(tokenOutAmountScaled, 18)));
            return beetsPrice;
        } catch (error) {
            console.error('BeetsPriceHandler: Batch swap query failed:', error);
            return null;
        }
    }
}
