import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';
import { Chain } from '@prisma/client';
import { tokenAndPrice, updatePrices } from './price-handler-helper';
import { LBPoolData } from '../../../pool/pool-data';

export class LbpPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'LbpPriceHandlerService';

    public async updatePricesForTokens(
        tokens: PrismaTokenWithTypes[],
        chains: Chain[],
    ): Promise<PrismaTokenWithTypes[]> {
        const timestamp = timestampRoundedUpToNearestHour();

        const lbps = await prisma.prismaPool.findMany({
            where: { type: 'LIQUIDITY_BOOTSTRAPPING', protocolVersion: 3, chain: { in: chains } },
            include: { tokens: true },
        });

        // Get reserve tokens
        const reserveTokens = [...new Set(lbps.map((p) => (p.typeData as LBPoolData).reserveToken))];
        const reservePrices = await prisma.prismaTokenCurrentPrice
            .findMany({
                where: {
                    chain: { in: chains },
                    tokenAddress: {
                        in: reserveTokens,
                    },
                },
            })
            .then((prices) => Object.fromEntries(prices.map((price) => [price.tokenAddress, price.price])));

        // Get unique project tokens and find pools that have reserve price
        const projectTokens = [...new Set(lbps.map((p) => (p.typeData as LBPoolData).projectToken))];
        const poolsWithReservePrice = lbps.filter((p) => reservePrices[(p.typeData as LBPoolData).reserveToken]);

        const updated: PrismaTokenWithTypes[] = [];
        const tokenAndPrices: tokenAndPrice[] = [];

        for (const projectTokenAddress of projectTokens) {
            const pool = poolsWithReservePrice.find(
                (pool) => (pool.typeData as LBPoolData).projectToken === projectTokenAddress,
            );

            // No reserve price
            if (!pool) continue;

            const typeData = pool.typeData as LBPoolData;
            const { reserveToken: reserveTokenAddress } = typeData;
            const token = tokens.find((t) => t.address === projectTokenAddress);

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

            tokenAndPrices.push({ address: token.address, chain: token.chain, price: price });
            updated.push(token);
        }

        await updatePrices(this.id, tokenAndPrices, timestamp);

        return updated;
    }
}
