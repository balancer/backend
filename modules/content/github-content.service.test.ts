import { initRequestScopedContext, setRequestScopedContextValue } from '../../modules/context/request-scoped-context';
import { networkContext } from '../../modules/network/network-context.service';
import { poolService } from '../../modules/pool/pool.service';
import { prisma } from '../../prisma/prisma-client';
import { ZERO_ADDRESS } from '@balancer/sdk';
import { tokenService } from '../token/token.service';
import { PoolsDocument } from '../subgraphs/gauge-subgraph/generated/gauge-subgraph-types';

// jest.mock('axios', () => ({
//     get: jest.fn().mockResolvedValue({
//         data: {
//                 mainnet: {
//                     '0xda3e8cd08753a05ed4103af28c69c47e35d6d8da': {
//                         name: 'mainnet1',
//                         asset: '0x862c57d48becb45583aeba3f489696d22466ca1b',
//                         summary: 'safe',
//                         review: './asd.md',
//                         warnings: [],
//                         upgradeableComponents: [],
//                     },
//                     '0xda3e8cd08753a05ed4103af28c69c47e35d6d8db': {
//                         name: 'mainnet1dup',
//                         asset: '0x862c57d48becb45583aeba3f489696d22466ca1b',
//                         summary: 'safe',
//                         review: './asd.md',
//                         warnings: [],
//                         upgradeableComponents: [],
//                     },
//                     '0x47b584e4c7c4a030060450ec9e51d52d919b1fcb': {
//                         name: 'mainnet2',
//                         asset: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
//                         summary: 'safe',
//                         review: './asd.md',
//                         warnings: [],
//                         upgradeableComponents: [],
//                     },
//                 },
//                 base: {
//                     '0x3786a6caab433f5dfe56503207df31df87c5b5c1': {
//                         name: 'base rateprovider',
//                         asset: '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22',
//                         summary: 'safe',
//                         review: './asd.md',
//                         warnings: [],
//                         upgradeableComponents: [],
//                     },
//                 },
//             },
//         },
//     }),
// }));

describe('sync new reviews', () => {
    it('should add to db from github', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '1');
        // await poolService.syncAllPoolsFromSubgraph();
        await networkContext.config.contentService.syncRateProviderReviews([
            'MAINNET',
            'BASE',
            'ARBITRUM',
            'OPTIMISM',
            'AVALANCHE',
            'FANTOM',
            'GNOSIS',
            'POLYGON',
            'ZKEVM',
        ]);
    });

    it('get rateprovider data from pool', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '1');

        const pool = await poolService.getGqlPool(
            '0x93d199263632a4ef4bb438f1feb99e57b4b5f0bd0000000000000000000005c2',
            'MAINNET',
        );

        const wstEth = pool.poolTokens.find((t) => t.address === '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0');
        expect(wstEth).toBeDefined();
        if (wstEth) {
            expect(wstEth.priceRateProviderData).toBeDefined();
            expect(wstEth.priceRateProviderData!.address).toBe('0x72d07d7dca67b8a406ad1ec34ce969c90bfee768');
        }
    });

    it('get rateprovider data from token', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '1');

        const tokens = await tokenService.getTokenDefinitions(['MAINNET']);

        const wstEth = tokens.find((t) => t.address === '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0');
        expect(wstEth).toBeDefined();
        if (wstEth) {
            expect(wstEth.rateProviderData).toBeDefined();
            expect(wstEth.rateProviderData!.address).toBe('0x72d07d7dca67b8a406ad1ec34ce969c90bfee768');
        }
    });

    it('two assets use the same rateprovider', async () => {
        const rateproviders = await prisma.prismaPriceRateProviderData.findMany({
            where: { tokenAddress: '0x862c57d48becb45583aeba3f489696d22466ca1b' },
        });

        expect(rateproviders.length).toBe(2);
    });

    it('should attach rateproviderdata to pool on query', async () => {
        // Query a pool using poolService
        const pool = await poolService.getGqlPool(
            '0x7f2b3b7fbd3226c5be438cde49a519f442ca2eda00020000000000000000067d',
            'MAINNET',
        );

        // Assert that rateproviderdata is attached to the pool
        for (const token of pool.poolTokens) {
            if (token.priceRateProvider && token.priceRateProvider !== ZERO_ADDRESS) {
                expect(token.priceRateProviderData).toBeDefined();
                expect(token.priceRateProviderData!.address).toBe('0xda3e8cd08753a05ed4103af28c69c47e35d6d8da');
            }
        }
    });

    it('should attach rateproviderdata to token on query', async () => {
        initRequestScopedContext();
        setRequestScopedContextValue('chainId', '1');
        const tokens = await tokenService.getTokenDefinitions(['MAINNET']);

        const token = tokens.find((t) => t.address === '0x862c57d48becb45583aeba3f489696d22466ca1b');
        expect(token).toBeDefined();
        expect(token?.rateProviderData).toBeDefined();
        expect(token?.rateProviderData?.address).toBe('0xda3e8cd08753a05ed4103af28c69c47e35d6d8da');
    });
});
