import { Chain } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';
import fantom from '../../../config/fantom';
import _ from 'lodash';

interface FbeetsDB {
    prismaFbeets: {
        findFirst: (args?: any) => Promise<{ id: string; ratio: string } | null>;
    };
    prismaPool: {
        findUnique: (args: any) => Promise<any>;
    };
}

export class FbeetsPriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'FbeetsPriceHandlerService';

    constructor(private db: FbeetsDB) {}

    async calculatePricesForTokens(tokens: TokenPriceData[], allPrices: Map<string, number>): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        try {
            const fbeetsAddress = fantom.fbeets!.address;
            const fbeetsPoolId = fantom.fbeets!.poolId;

            // Get fbeets ratio from database
            const fbeets = await this.db.prismaFbeets.findFirst({});
            if (!fbeets?.ratio) {
                console.error('FbeetsPriceHandler: fbeets ratio not found');
                return [];
            }

            // Get pool data
            const pool = await this.db.prismaPool.findUnique({
                where: { id_chain: { id: fbeetsPoolId, chain: Chain.FANTOM } },
                include: { 
                    dynamicData: true, 
                    tokens: { include: { token: true } } 
                },
            });
            if (!pool) {
                console.error('FbeetsPriceHandler: pool not found');
                return [];
            }

            // Calculate fbeets price using pool tokens and their prices from allPrices
            const fbeetsPrice = this.calculateFbeetsPrice(pool, fbeets.ratio, allPrices);
            if (fbeetsPrice === null) {
                console.error('FbeetsPriceHandler: could not calculate fbeets price');
                return [];
            }

            // Create price items for all accepted tokens
            const priceItems: PriceItem[] = acceptedTokens.map((token) => ({
                address: token.address,
                chain: token.chain,
                price: fbeetsPrice,
                updatedAt: new Date(),
                updatedBy: this.id,
            }));

            return priceItems;
        } catch (error) {
            console.error('FbeetsPriceHandler: Error calculating prices:', error);
            return [];
        }
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        const fbeetsAddress = fantom.fbeets!.address;
        return tokens.filter((token) => token.chain === Chain.FANTOM && token.address === fbeetsAddress);
    }

    private calculateFbeetsPrice(
        pool: any,
        fbeetsRatio: string,
        allPrices: Map<string, number>,
    ): number | null {
        if (!pool.dynamicData || !pool.tokens || pool.tokens.length === 0) {
            return null;
        }

        const totalShares = parseFloat(pool.dynamicData.totalShares || '0');
        const ratio = parseFloat(fbeetsRatio);

        if (totalShares === 0 || ratio === 0) {
            return null;
        }

        // Check if we have prices for all pool tokens
        const missingPrices = pool.tokens.filter((token: any) => !allPrices.has(token.address));
        if (missingPrices.length > 0) {
            console.error('FbeetsPriceHandler: Missing prices for tokens:', missingPrices.map((t: any) => t.address));
            return null;
        }

        // Calculate weighted price for each token in the pool
        const fbeetsPrice = _.sum(
            pool.tokens.map((token: any) => {
                const balance = parseFloat(token.balance || '0');
                const tokenPrice = allPrices.get(token.address) || 0;

                if (balance === 0) {
                    return 0;
                }

                // Formula: (balance / totalShares) * fbeetsRatio * tokenPrice
                return (balance / totalShares) * ratio * tokenPrice;
            }),
        );

        return fbeetsPrice;
    }
}