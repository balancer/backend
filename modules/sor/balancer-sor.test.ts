import { BalancerSorService } from './balancer-sor.service';
import { tokenService } from '../token/token.service';
import { poolService } from '../pool/pool.service';

import { GqlSorGetSwapsResponse, GqlSorSwapOptionsInput, GqlSorSwapType, GqlPoolMinimal } from '../../schema';

// npx jest --testPathPattern=modules/beethoven/balancer-sor.test.ts
describe('SmartOrderRouter', () => {
    test('swap with mixed decimals', async () => {
        const tokens = await tokenService.getTokens();
        const pools = await poolService.getGqlPools({
            where: { idIn: ['0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015'] },
        });

        const sor = new BalancerSorService();
        const out = {
            tokenIn: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
            tokenOut: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
            swapType: 'EXACT_IN' as GqlSorSwapType,
            tokens,
            tokenInAmtEvm: '1000000000000000000000',
            tokenOutAmtEvm: '21524991',
            swapAmountForSwaps: '1000000000000000000000',
            returnAmountConsideringFees: '21524991',
            returnAmountFromSwaps: '21524991',
            routes: [
                {
                    tokenIn: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                    tokenOut: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                    tokenInAmount: '1000',
                    tokenOutAmount: '21.524991694650096005',
                    share: 1,
                    hops: [
                        {
                            tokenIn: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                            tokenOut: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                            tokenInAmount: '1000',
                            tokenOutAmount: '21.524991694650096005',
                            poolId: '0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015',
                        },
                    ],
                },
            ],
            pools,
            marketSp: '46.44498985968269',
            swaps: [
                {
                    poolId: '0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015',
                    assetInIndex: 0,
                    assetOutIndex: 1,
                    amount: '1000000000000000000000',
                    userData: '0x',
                    returnAmount: '21524991',
                },
            ],
            tokenAddresses: [
                '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
            ],
        };
        const result = sor.formatResponse(out);
        const actual = {
            swapAmount: '1000.0',
            swapAmountForSwaps: '1000000000000000000000',
            returnAmount: '21.524991',
            returnAmountFromSwaps: '21524991',
            returnAmountConsideringFees: '21524991',
            swaps: [
                {
                    poolId: '0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015',
                    assetInIndex: 0,
                    assetOutIndex: 1,
                    amount: '1000000000000000000000',
                    userData: '0x',
                    returnAmount: '21524991',
                },
            ],
            tokenAddresses: [
                '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
            ],
            tokenIn: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
            tokenOut: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
            marketSp: '46.44498985968269',
            routes: [
                {
                    tokenIn: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                    tokenOut: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                    tokenInAmount: '1000',
                    tokenOutAmount: '21.524991',
                    share: 1,
                    hops: [
                        {
                            tokenIn: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
                            tokenOut: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                            tokenInAmount: '1000',
                            tokenOutAmount: '21.524991694650096005',
                            poolId: '0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015',
                            pool: pools[0],
                        },
                    ],
                },
            ],
            swapType: 'EXACT_IN',
            tokenInAmount: '1000.0',
            tokenOutAmount: '21.524991',
            swapAmountScaled: '1000000000000000000000',
            returnAmountScaled: '21524991',
            effectivePrice: '46.45762685800890694914',
            effectivePriceReversed: '0.021524991',
            priceImpact: '0.00027208528550431865',
        };
        expect(result).toEqual(actual);
    });
    test('swap with native asset', async () => {
        const tokens = await tokenService.getTokens();
        const pools = await poolService.getGqlPools({
            where: {
                idIn: [
                    '0xc385e76e575b2d71eb877c27dcc1608f77fada99000000000000000000000719',
                    '0x7449f09c8f0ed490472d7c14b4eef235620d027000010000000000000000072d',
                    '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f000000000000000000000718',
                ],
            },
        });

        const sor = new BalancerSorService();
        const out = {
            tokenIn: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
            tokenOut: '0x0000000000000000000000000000000000000000',
            swapType: 'EXACT_IN' as GqlSorSwapType,
            tokens,
            tokenInAmtEvm: '10000000',
            tokenOutAmtEvm: '34434611675857195780',
            swapAmountForSwaps: '10000000',
            returnAmountConsideringFees: '34434650939050394265',
            returnAmountFromSwaps: '34434650939080394265',
            routes: [
                {
                    tokenIn: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                    tokenOut: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
                    tokenInAmount: '10',
                    tokenOutAmount: '34.434650939080394265',
                    share: 1,
                    hops: [
                        {
                            tokenIn: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                            tokenOut: '0xc385e76e575b2d71eb877c27dcc1608f77fada99',
                            tokenInAmount: '10',
                            tokenOutAmount: '9.953043613661588446',
                            poolId: '0xc385e76e575b2d71eb877c27dcc1608f77fada99000000000000000000000719',
                        },
                        {
                            tokenIn: '0xc385e76e575b2d71eb877c27dcc1608f77fada99',
                            tokenOut: '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f',
                            tokenInAmount: '9.953043613661588446',
                            tokenOutAmount: '34.355661787346070666',
                            poolId: '0x7449f09c8f0ed490472d7c14b4eef235620d027000010000000000000000072d',
                        },
                        {
                            tokenIn: '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f',
                            tokenOut: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
                            tokenInAmount: '34.355661787346070666',
                            tokenOutAmount: '34.434650939080394265',
                            poolId: '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f000000000000000000000718',
                        },
                    ],
                },
            ],
            pools,
            marketSp: '0.29021486756308521004963850902453996332730905029153527',
            swaps: [
                {
                    poolId: '0xc385e76e575b2d71eb877c27dcc1608f77fada99000000000000000000000719',
                    assetInIndex: 0,
                    assetOutIndex: 1,
                    amount: '10000000',
                    userData: '0x',
                    returnAmount: '9953043613661588446',
                },
                {
                    poolId: '0x7449f09c8f0ed490472d7c14b4eef235620d027000010000000000000000072d',
                    assetInIndex: 1,
                    assetOutIndex: 2,
                    amount: '0',
                    userData: '0x',
                    returnAmount: '34355661787346070666',
                },
                {
                    poolId: '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f000000000000000000000718',
                    assetInIndex: 2,
                    assetOutIndex: 3,
                    amount: '0',
                    userData: '0x',
                    returnAmount: '34434650939080394265',
                },
            ],
            tokenAddresses: [
                '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                '0xc385e76e575b2d71eb877c27dcc1608f77fada99',
                '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f',
                '0x0000000000000000000000000000000000000000',
            ],
        };
        const result = sor.formatResponse(out);
        const actual = {
            swapAmount: '10.0',
            swapAmountForSwaps: '10000000',
            returnAmount: '34.43461167585719578',
            returnAmountFromSwaps: '34434650939080394265',
            returnAmountConsideringFees: '34434650939050394265',
            swaps: [
                {
                    poolId: '0xc385e76e575b2d71eb877c27dcc1608f77fada99000000000000000000000719',
                    assetInIndex: 0,
                    assetOutIndex: 1,
                    amount: '10000000',
                    userData: '0x',
                    returnAmount: '9953043613661588446',
                },
                {
                    poolId: '0x7449f09c8f0ed490472d7c14b4eef235620d027000010000000000000000072d',
                    assetInIndex: 1,
                    assetOutIndex: 2,
                    amount: '0',
                    userData: '0x',
                    returnAmount: '34355661787346070666',
                },
                {
                    poolId: '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f000000000000000000000718',
                    assetInIndex: 2,
                    assetOutIndex: 3,
                    amount: '0',
                    userData: '0x',
                    returnAmount: '34434650939080394265',
                },
            ],
            tokenAddresses: [
                '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                '0xc385e76e575b2d71eb877c27dcc1608f77fada99',
                '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f',
                '0x0000000000000000000000000000000000000000',
            ],
            tokenIn: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
            tokenOut: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            marketSp: '0.29021486756308521004963850902453996332730905029153527',
            routes: [
                {
                    tokenIn: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                    tokenOut: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
                    tokenInAmount: '10',
                    tokenOutAmount: '34.43461167585719578',
                    share: 1,
                    hops: [
                        {
                            tokenIn: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
                            tokenOut: '0xc385e76e575b2d71eb877c27dcc1608f77fada99',
                            tokenInAmount: '10',
                            tokenOutAmount: '9.953043613661588446',
                            poolId: '0xc385e76e575b2d71eb877c27dcc1608f77fada99000000000000000000000719',
                            pool: pools.find(
                                (p) => p.id === '0xc385e76e575b2d71eb877c27dcc1608f77fada99000000000000000000000719',
                            ),
                        },
                        {
                            tokenIn: '0xc385e76e575b2d71eb877c27dcc1608f77fada99',
                            tokenOut: '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f',
                            tokenInAmount: '9.953043613661588446',
                            tokenOutAmount: '34.355661787346070666',
                            poolId: '0x7449f09c8f0ed490472d7c14b4eef235620d027000010000000000000000072d',
                            pool: pools.find(
                                (p) => p.id === '0x7449f09c8f0ed490472d7c14b4eef235620d027000010000000000000000072d',
                            ),
                        },
                        {
                            tokenIn: '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f',
                            tokenOut: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
                            tokenInAmount: '34.355661787346070666',
                            tokenOutAmount: '34.434650939080394265',
                            poolId: '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f000000000000000000000718',
                            pool: pools.find(
                                (p) => p.id === '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f000000000000000000000718',
                            ),
                        },
                    ],
                },
            ],
            swapType: 'EXACT_IN',
            tokenInAmount: '10.0',
            tokenOutAmount: '34.43461167585719578',
            swapAmountScaled: '10000000',
            returnAmountScaled: '34434611675857195780',
            effectivePrice: '0.29040548196485696673',
            effectivePriceReversed: '3.443461167585719578',
            priceImpact: '0.00065680439934843116',
        };
        expect(result).toEqual(actual);
    });
});
