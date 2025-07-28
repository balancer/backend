import { Chain } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';

interface BptDB {
    prismaPool: {
        findMany(params: {
            where: {
                dynamicData: { totalLiquidity: { gt: number } };
                chain: { in: Chain[] };
            };
            include: { dynamicData: true };
        }): Promise<PoolWithDynamicData[]>;
    };
}

interface PoolWithDynamicData {
    address: string;
    chain: Chain;
    dynamicData: {
        totalLiquidity: number;
        totalShares: string;
    } | null;
}

export class BptPriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'BptPriceHandlerService';

    constructor(private db: BptDB) {}

    async calculatePricesForTokens(tokens: TokenPriceData[]): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        try {
            // Get unique chains from accepted tokens
            const chains = [...new Set(acceptedTokens.map(token => token.chain))];
            
            // Fetch pools with dynamic data
            const pools = await this.db.prismaPool.findMany({
                where: { 
                    dynamicData: { totalLiquidity: { gt: 0.1 } }, 
                    chain: { in: chains } 
                },
                include: { dynamicData: true },
            });

            const priceItems: PriceItem[] = [];

            for (const token of acceptedTokens) {
                const pool = pools.find(
                    (pool) => pool.address === token.address && pool.chain === token.chain
                );

                if (
                    pool?.dynamicData &&
                    pool.dynamicData.totalLiquidity !== 0 &&
                    parseFloat(pool.dynamicData.totalShares) !== 0
                ) {
                    const price = pool.dynamicData.totalLiquidity / parseFloat(pool.dynamicData.totalShares);
                    
                    priceItems.push({
                        address: token.address,
                        chain: token.chain,
                        price: price,
                        updatedAt: new Date(),
                        updatedBy: this.id,
                    });
                }
            }

            return priceItems;
        } catch (error) {
            console.error('BptPriceHandler: Error calculating prices:', error);
            return [];
        }
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        return tokens.filter((token) => token.types.includes('BPT') || token.types.includes('PHANTOM_BPT'));
    }
}