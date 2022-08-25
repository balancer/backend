import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { timestampRoundedUpToNearestHour } from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';
import { networkConfig } from '../../../config/network-config';
import _ from 'lodash';

export class FbeetsPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'FbeetsPriceHandlerService';

    public async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        return [networkConfig.fbeets.address];
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
        const timestamp = timestampRoundedUpToNearestHour();
        const fbeetsAddress = networkConfig.fbeets.address;
        const fbeets = await prisma.prismaFbeets.findFirst({});
        const pool = await prisma.prismaPool.findUnique({
            where: { id: networkConfig.fbeets.poolId },
            include: { dynamicData: true, tokens: { include: { dynamicData: true, token: true } } },
        });
        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            where: { tokenAddress: { in: pool?.tokens.map((token) => token.address) } },
        });

        if (!fbeets || !pool || tokenPrices.length !== pool.tokens.length) {
            throw new Error('FbeetsPriceHandlerService: Missing required data to update fbeets price');
        }

        const fbeetsPrice = _.sum(
            pool.tokens.map((token) => {
                const totalShares = parseFloat(pool.dynamicData?.totalShares || '0');
                const balance = parseFloat(token.dynamicData?.balance || '0');
                const tokenPrice = tokenPrices.find((price) => price.tokenAddress === token.address)?.price || 0;

                if (totalShares === 0) {
                    return 0;
                }

                return (balance / totalShares) * parseFloat(fbeets.ratio) * tokenPrice;
            }),
        );

        await prisma.prismaTokenCurrentPrice.upsert({
            where: { tokenAddress: fbeetsAddress },
            update: { price: fbeetsPrice },
            create: {
                tokenAddress: fbeetsAddress,
                timestamp,
                price: fbeetsPrice,
            },
        });

        await prisma.prismaTokenPrice.upsert({
            where: { tokenAddress_timestamp: { tokenAddress: fbeetsAddress, timestamp } },
            update: { price: fbeetsPrice, close: fbeetsPrice },
            create: {
                tokenAddress: fbeetsAddress,
                timestamp,
                price: fbeetsPrice,
                high: fbeetsPrice,
                low: fbeetsPrice,
                open: fbeetsPrice,
                close: fbeetsPrice,
            },
        });

        return [networkConfig.fbeets.address];
    }
}
