import { Chain } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { timestampRoundedUpToNearestHour } from '../common/time';
import { TokenPriceData, PriceItem } from './types';
import { SwapRepository } from '../repositories/events/types';
import { SwapEvent } from '../../prisma/prisma-types';
import _ from 'lodash';

export class PricingRepository {
    constructor(private swapRepository: SwapRepository) {}

    async getTokensForPricing(chain: Chain, tokenAddresses?: string[]): Promise<TokenPriceData[]> {
        const tokens = await prisma.prismaToken.findMany({
            where: {
                chain: chain,
                ...(tokenAddresses && tokenAddresses.length > 0 && { address: { in: tokenAddresses } }),
            },
            select: {
                address: true,
                chain: true,
                coingeckoTokenId: true,
                excludedFromCoingecko: true,
                underlyingTokenAddress: true,
                unwrapRate: true,
                types: {
                    select: {
                        type: true,
                    },
                },
            },
        });

        // Fetch swap data for pricing
        const swaps = await this.swapRepository.getSwapsForPricing(chain);

        // Collect all token addresses that need prices
        const allTokenAddresses = this.collectAllTokenAddresses(tokens, swaps);

        // Fetch all prices in a single query
        const allPrices = await this.fetchAllPrices(chain, allTokenAddresses);

        return tokens.map((token) => ({
            address: token.address,
            chain: token.chain,
            coingeckoTokenId: token.coingeckoTokenId || undefined,
            excludedFromCoingecko: token.excludedFromCoingecko || undefined,
            types: token.types.map((t) => t.type),
            underlyingTokenAddress: token.underlyingTokenAddress || undefined,
            unwrapRate: token.unwrapRate || undefined,
            underlyingTokenPrice: token.underlyingTokenAddress
                ? allPrices.get(token.underlyingTokenAddress)
                : undefined,
            currentPrice: allPrices.get(token.address),
            latestSwaps: this.filterSwapsForToken(swaps, token.address),
        }));
    }

    async updatePrices(priceItems: PriceItem[]): Promise<string[]> {
        if (priceItems.length === 0) {
            return [];
        }

        const operations: any[] = [];

        for (const item of priceItems) {
            const hourlyTimestamp = timestampRoundedUpToNearestHour();

            // Update or create hourly price in TokenPrice table
            operations.push(
                prisma.prismaTokenPrice.upsert({
                    where: {
                        tokenAddress_timestamp_chain: {
                            tokenAddress: item.address,
                            timestamp: hourlyTimestamp,
                            chain: item.chain,
                        },
                    },
                    update: {
                        price: item.price,
                        close: item.price,
                        updatedBy: item.updatedBy,
                        updatedAt: item.updatedAt,
                    },
                    create: {
                        tokenAddress: item.address,
                        chain: item.chain,
                        timestamp: hourlyTimestamp,
                        price: item.price,
                        high: item.price,
                        low: item.price,
                        open: item.price,
                        close: item.price,
                        updatedBy: item.updatedBy,
                        updatedAt: item.updatedAt,
                    },
                }),
            );

            // Update or create current price in TokenCurrentPrice table
            operations.push(
                prisma.prismaTokenCurrentPrice.upsert({
                    where: {
                        tokenAddress_chain: {
                            tokenAddress: item.address,
                            chain: item.chain,
                        },
                    },
                    update: {
                        price: item.price,
                        timestamp: hourlyTimestamp,
                        updatedBy: item.updatedBy,
                        updatedAt: item.updatedAt,
                    },
                    create: {
                        tokenAddress: item.address,
                        chain: item.chain,
                        timestamp: hourlyTimestamp,
                        price: item.price,
                        updatedBy: item.updatedBy,
                        updatedAt: item.updatedAt,
                    },
                }),
            );
        }

        await prismaBulkExecuteOperations(operations);

        return priceItems.map((item) => item.address);
    }

    private collectAllTokenAddresses(
        tokens: { address: string; underlyingTokenAddress?: string | null }[],
        swaps: SwapEvent[],
    ): string[] {
        const addresses = new Set<string>();

        // Add all target token addresses
        tokens.forEach((token) => {
            addresses.add(token.address);
            // Add underlying token addresses for ERC4626/Aave tokens
            if (token.underlyingTokenAddress) {
                addresses.add(token.underlyingTokenAddress);
            }
        });

        // Add all swap token addresses (for other tokens in swaps)
        swaps.forEach((swap) => {
            addresses.add(swap.payload.tokenIn.address);
            addresses.add(swap.payload.tokenOut.address);
        });

        return Array.from(addresses);
    }

    private async fetchAllPrices(chain: Chain, tokenAddresses: string[]): Promise<Map<string, number>> {
        if (tokenAddresses.length === 0) {
            return new Map();
        }

        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            where: {
                chain: chain,
                ...(tokenAddresses && tokenAddresses.length < 20 ? { tokenAddress: { in: tokenAddresses } } : {}), // Just fetch all when more tokens is requested
            },
            select: {
                tokenAddress: true,
                price: true,
            },
        });

        const priceMap = new Map<string, number>();
        tokenPrices.forEach((tokenPrice) => {
            priceMap.set(tokenPrice.tokenAddress, tokenPrice.price);
        });

        return priceMap;
    }

    private filterSwapsForToken(swaps: SwapEvent[], tokenAddress: string): SwapEvent[] {
        return swaps.filter(
            (swap) => swap.payload.tokenIn.address === tokenAddress || swap.payload.tokenOut.address === tokenAddress,
        );
    }
}
