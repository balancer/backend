import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';
import { Chain } from '@prisma/client';
import { tokenAndPrice, updatePrices } from './price-handler-helper';

export class BptPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'BptPriceHandlerService';

    private getAcceptedTokens(tokens: PrismaTokenWithTypes[]): PrismaTokenWithTypes[] {
        return tokens.filter((token) => token.types.includes('BPT') || token.types.includes('PHANTOM_BPT'));
    }

    public async updatePricesForTokens(
        tokens: PrismaTokenWithTypes[],
        chains: Chain[],
    ): Promise<PrismaTokenWithTypes[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);
        const timestamp = timestampRoundedUpToNearestHour();
        const pools = await prisma.prismaPool.findMany({
            where: { dynamicData: { totalLiquidity: { gt: 0.1 } }, chain: { in: chains } },
            include: { dynamicData: true },
        });
        const updated: PrismaTokenWithTypes[] = [];
        const tokenAndPrices: tokenAndPrice[] = [];

        for (const token of acceptedTokens) {
            const pool = pools.find((pool) => pool.address === token.address && pool.chain === token.chain);

            if (
                pool?.dynamicData &&
                pool.dynamicData.totalLiquidity !== 0 &&
                parseFloat(pool.dynamicData.totalShares) !== 0
            ) {
                const price = pool.dynamicData.totalLiquidity / parseFloat(pool.dynamicData.totalShares);
                tokenAndPrices.push({ address: token.address, chain: token.chain, price: price });
                updated.push(token);
            }
        }

        await updatePrices(this.id, tokenAndPrices, timestamp);

        return updated;
    }
}
