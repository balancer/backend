import { TokenPriceHandler } from '../../token-types';
import { PrismaTokenWithTypes } from '../../../../prisma/prisma-types';
import { timestampEndOfDayMidnight, timestampRoundedUpToNearestHour } from '../../../common/time';
import { prisma } from '../../../../prisma/prisma-client';
import _ from 'lodash';
import { AllNetworkConfigs } from '../../../network/network-config';

export class FbeetsPriceHandlerService implements TokenPriceHandler {
    public readonly exitIfFails = false;
    public readonly id = 'FbeetsPriceHandlerService';
    private readonly fbeetsAddress = AllNetworkConfigs['250'].data.fbeets!.address;
    private readonly fbeetsPoolId = AllNetworkConfigs['250'].data.fbeets!.poolId;

    private getAcceptedTokens(tokens: PrismaTokenWithTypes[]): PrismaTokenWithTypes[] {
        return tokens.filter((token) => token.chain === 'FANTOM' && token.address === this.fbeetsAddress);
    }

    public async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<PrismaTokenWithTypes[]> {
        const acceptedTokens = this.getAcceptedTokens(tokens);
        const timestamp = timestampRoundedUpToNearestHour();
        const timestampMidnight = timestampEndOfDayMidnight();
        const fbeets = await prisma.prismaFbeets.findFirst({});
        const pool = await prisma.prismaPool.findUnique({
            where: { id_chain: { id: this.fbeetsPoolId, chain: 'FANTOM' } },
            include: { dynamicData: true, tokens: { include: { dynamicData: true, token: true } } },
        });
        const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
            where: { tokenAddress: { in: pool?.tokens.map((token) => token.address) }, chain: 'FANTOM' },
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
            where: { tokenAddress_chain: { tokenAddress: this.fbeetsAddress, chain: 'FANTOM' } },
            update: { price: fbeetsPrice },
            create: {
                tokenAddress: this.fbeetsAddress,
                chain: 'FANTOM',
                timestamp,
                price: fbeetsPrice,
            },
        });

        await prisma.prismaTokenPrice.upsert({
            where: {
                tokenAddress_timestamp_chain: { tokenAddress: this.fbeetsAddress, timestamp, chain: 'FANTOM' },
            },
            update: { price: fbeetsPrice, close: fbeetsPrice },
            create: {
                tokenAddress: this.fbeetsAddress,
                chain: 'FANTOM',
                timestamp,
                price: fbeetsPrice,
                high: fbeetsPrice,
                low: fbeetsPrice,
                open: fbeetsPrice,
                close: fbeetsPrice,
            },
        });

        await prisma.prismaTokenPrice.upsert({
            where: {
                tokenAddress_timestamp_chain: {
                    tokenAddress: this.fbeetsAddress,
                    timestamp: timestampMidnight,
                    chain: 'FANTOM',
                },
            },
            update: { price: fbeetsPrice, close: fbeetsPrice },
            create: {
                tokenAddress: this.fbeetsAddress,
                chain: 'FANTOM',
                timestamp: timestampMidnight,
                price: fbeetsPrice,
                high: fbeetsPrice,
                low: fbeetsPrice,
                open: fbeetsPrice,
                close: fbeetsPrice,
            },
        });

        return acceptedTokens;
    }
}
