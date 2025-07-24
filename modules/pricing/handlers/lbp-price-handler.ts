import { Chain, PrismaPoolType } from '@prisma/client';
import { PriceHandler, TokenPriceData, PriceItem } from '../types';

export type LBPoolData = {
    startTime: number;
    endTime: number;
    lbpOwner: string;
    isProjectTokenSwapInBlocked: boolean;
    projectToken: string;
    projectTokenIndex: number;
    projectTokenStartWeight: number;
    projectTokenEndWeight: number;
    reserveToken: string;
    reserveTokenIndex: number;
    reserveTokenStartWeight: number;
    reserveTokenEndWeight: number;
};

interface LbpDB {
    prismaPool: {
        findMany(params: {
            where: {
                type: PrismaPoolType;
                protocolVersion: number;
                chain: { in: Chain[] };
            };
            include: { tokens: true };
        }): Promise<PoolWithTokens[]>;
    };
}

interface PoolWithTokens {
    address: string;
    chain: Chain;
    typeData: any;
    tokens: PoolToken[];
}

interface PoolToken {
    address: string;
    balance: string;
    weight: string | null;
}

export class LbpPriceHandler implements PriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'LbpPriceHandlerService';

    constructor(private db: LbpDB) {}

    async calculatePricesForTokens(tokens: TokenPriceData[], allPrices: Map<string, number>): Promise<PriceItem[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);

        if (acceptedTokens.length === 0) {
            return [];
        }

        if (allPrices.size === 0) {
            return [];
        }

        try {
            // Get unique chains from accepted tokens
            const chains = Array.from(new Set(acceptedTokens.map((token) => token.chain)));

            // Fetch LBP pools
            const lbps = await this.db.prismaPool.findMany({
                where: { type: 'LIQUIDITY_BOOTSTRAPPING', protocolVersion: 3, chain: { in: chains } },
                include: { tokens: true },
            });

            if (lbps.length === 0) {
                return [];
            }

            // Get reserve tokens and their prices from allPrices map
            const reserveTokens = Array.from(new Set(lbps.map((p) => (p.typeData as LBPoolData).reserveToken)));
            const reservePrices: Record<string, number> = {};

            // Get prices from allPrices map
            reserveTokens.forEach((tokenAddress) => {
                if (allPrices.has(tokenAddress)) {
                    reservePrices[tokenAddress] = allPrices.get(tokenAddress)!;
                }
            });

            // Get unique project tokens and find pools that have reserve price
            const projectTokens = Array.from(new Set(lbps.map((p) => (p.typeData as LBPoolData).projectToken)));
            const poolsWithReservePrice = lbps.filter((p) => reservePrices[(p.typeData as LBPoolData).reserveToken]);

            const priceItems: PriceItem[] = [];

            for (const projectTokenAddress of projectTokens) {
                const pool = poolsWithReservePrice.find(
                    (pool) => (pool.typeData as LBPoolData).projectToken === projectTokenAddress,
                );

                // No reserve price
                if (!pool) continue;

                const typeData = pool.typeData;
                const { reserveToken: reserveTokenAddress } = typeData;
                const token = acceptedTokens.find((t) => t.address === projectTokenAddress);

                // No need to price
                if (!token) continue;

                const projectToken = pool.tokens.find((pt) => pt.address === projectTokenAddress);
                const reserveToken = pool.tokens.find((pt) => pt.address === reserveTokenAddress);

                if (!projectToken || !reserveToken) continue;

                const projectBalance = parseFloat(projectToken.balance);
                const projectWeight = parseFloat(projectToken.weight!);
                const reserveBalance = parseFloat(reserveToken.balance);
                const reserveWeight = parseFloat(reserveToken.weight!);

                // Weighted pool formula
                const projectPrice = reserveBalance / reserveWeight / (projectBalance / projectWeight);
                const price = projectPrice * reservePrices[reserveTokenAddress];

                priceItems.push({
                    address: token.address,
                    chain: token.chain,
                    price: price,
                    updatedAt: new Date(),
                    updatedBy: this.id,
                });
            }

            return priceItems;
        } catch (error) {
            console.error('LbpPriceHandler: Error calculating prices:', error);
            return [];
        }
    }

    private getAcceptedTokens(tokens: TokenPriceData[]): TokenPriceData[] {
        // Accept all tokens - LBP handler determines which tokens are project tokens by checking pools
        return tokens;
    }
}
