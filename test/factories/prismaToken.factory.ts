import { PrismaToken } from '@prisma/client';
import { Factory } from 'fishery';
import { createRandomAddress } from '../utils';
import { PrismaPoolTokenWithDynamicData } from '../../prisma/prisma-types';
import { ZERO_ADDRESS } from '@balancer/sdk';

export const prismaPoolTokenFactory = Factory.define<PrismaPoolTokenWithDynamicData>(({ params }) => {
    const tokenAddress = params?.address || createRandomAddress();
    const poolId = params?.poolId || createRandomAddress();
    return {
        id: poolId + '-' + tokenAddress,
        address: tokenAddress,
        poolId: poolId,
        chain: 'SEPOLIA',
        index: 0,
        nestedPoolId: null,
        priceRateProvider: ZERO_ADDRESS,
        exemptFromProtocolYieldFee: false,
        token: prismaTokenFactory.build({ address: tokenAddress }),
        dynamicData: prismaPoolTokenDynamicDataFactory.build({ id: poolId + '-' + tokenAddress }),
        scalingFactor: null,
    };
});

export const prismaTokenFactory = Factory.define<PrismaToken>(() => {
    return {
        address: createRandomAddress(),
        chain: 'SEPOLIA',
        symbol: 'TestToken',
        name: 'testToken',
        description: '',
        decimals: 18,
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
        underlyingTokenAddress: null,
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
