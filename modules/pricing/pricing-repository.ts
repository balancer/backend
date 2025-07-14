import { Chain } from '@prisma/client';
import { prisma } from '../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { timestampRoundedUpToNearestHour } from '../common/time';
import { TokenPriceData, PriceItem } from './types';
import _ from 'lodash';

export class PricingRepository {
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

        // Get all unique underlying token addresses
        const underlyingAddresses = _.uniq(
            tokens.map((token) => token.underlyingTokenAddress).filter((address) => address !== null),
        ) as string[];

        // Fetch underlying token prices
        const underlyingPriceMap = new Map<string, number>();
        if (underlyingAddresses.length > 0) {
            const prices = await prisma.prismaTokenCurrentPrice.findMany({
                where: {
                    tokenAddress: { in: underlyingAddresses },
                    chain: chain,
                },
                select: {
                    tokenAddress: true,
                    price: true,
                },
            });
            prices.forEach((p) => {
                underlyingPriceMap.set(p.tokenAddress, p.price);
            });
        }

        return tokens.map((token) => ({
            address: token.address,
            chain: token.chain,
            coingeckoTokenId: token.coingeckoTokenId || undefined,
            excludedFromCoingecko: token.excludedFromCoingecko || undefined,
            types: token.types.map((t) => t.type),
            underlyingTokenAddress: token.underlyingTokenAddress || undefined,
            unwrapRate: token.unwrapRate || undefined,
            underlyingTokenPrice: token.underlyingTokenAddress
                ? underlyingPriceMap.get(token.underlyingTokenAddress)
                : undefined,
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
}
