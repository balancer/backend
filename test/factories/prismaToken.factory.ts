import { PrismaToken } from '@prisma/client';
import { Factory } from 'fishery';
import { createRandomAddress } from '../utils';
import { PrismaPoolTokenWithDynamicData } from '../../prisma/prisma-types';
import { ZERO_ADDRESS } from '@balancer/sdk';

export const prismaPoolTokenFactory = Factory.define<PrismaPoolTokenWithDynamicData>(({ params }) => {
    const address = params?.address || createRandomAddress();
    const poolId = params?.poolId || createRandomAddress();
    const id = poolId + '-' + address;
    return {
        id,
        address,
        poolId: poolId,
        chain: 'SEPOLIA',
        index: 0,
        nestedPoolId: null,
        priceRateProvider: ZERO_ADDRESS,
        exemptFromProtocolYieldFee: false,
        token: prismaTokenFactory.build({ address }),
        dynamicData: prismaPoolTokenDynamicDataFactory.build({ id }),
    };
});

export const prismaTokenFactory = Factory.define<PrismaToken>(({ params }) => {
    const address = params?.address || createRandomAddress();
    const decimals = params?.decimals || 18;
    return {
        address,
        chain: 'SEPOLIA',
        symbol: 'TestToken',
        name: 'testToken',
        description: '',
        decimals,
        logoURI: '',
        websiteUrl: '',
        discordUrl: '',
        telegramUrl: null,
        twitterUsername: null,
        coingeckoTokenId: null,
        priority: 0,
        coingeckoContractAddress: null,
        coingeckoPlatformId: null,
        excludedFromCoingecko: false,
    };
});

export const prismaPoolTokenDynamicDataFactory = Factory.define<PrismaPoolTokenWithDynamicData['dynamicData']>(
    ({ params }) => {
        const id = params?.id || createRandomAddress();
        return {
            id,
            poolTokenId: id,
            blockNumber: 1710806400,
            updatedAt: new Date(),
            chain: 'SEPOLIA',
            balance: '10.000000000000000000',
            balanceUSD: 10,
            weight: '0.5',
            priceRate: '1',
            latestFxPrice: null,
        };
    },
);
