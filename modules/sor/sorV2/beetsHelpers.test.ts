import { SingleSwap, SwapKind, BatchSwapStep } from '@balancer/sdk';
import { GqlPoolMinimal, GqlSorSwapRoute } from '../../../schema';
import { mapBatchSwap, mapRoutes, splitPaths } from './beetsHelpers';
import { poolService } from '../../pool/pool.service';

// npx jest --testPathPattern=modules/sor/sorV2/beetsHelpers.test.ts
describe('sorV2 Service - Routes', () => {
    describe('SingleSwap', () => {
        let singleSwap: SingleSwap;
        let pools: GqlPoolMinimal[];
        let expectedRoute: GqlSorSwapRoute[];
        const assetIn = '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4';
        const assetOut = '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7';
        const assets = ['0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4', '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7'];

        beforeAll(async () => {
            pools = await poolService.getGqlPools({
                where: { idIn: ['0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c'] },
            });
            singleSwap = {
                poolId: '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                kind: SwapKind.GivenIn,
                assetIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                assetOut: '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                amount: BigInt(0),
                userData: '0x',
            };
            expectedRoute = [
                {
                    hops: [
                        {
                            pool: pools[0],
                            poolId: '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                            tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                            tokenInAmount: '',
                            tokenOut: '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                            tokenOutAmount: '',
                        },
                    ],
                    share: 1,
                    tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                    tokenInAmount: '',
                    tokenOut: '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                    tokenOutAmount: '',
                },
            ];
        });
        test('GivenIn', () => {
            const amountIn = '123456789112345678';
            const amountOut = '876543210987654321';
            singleSwap.kind = SwapKind.GivenIn;
            singleSwap.amount = BigInt(amountIn);
            expectedRoute[0].tokenInAmount = amountIn;
            expectedRoute[0].tokenOutAmount = amountOut;
            expectedRoute[0].hops[0].tokenInAmount = amountIn;
            expectedRoute[0].hops[0].tokenOutAmount = amountOut;
            const mappedRoute = mapRoutes(
                singleSwap,
                amountIn,
                amountOut,
                pools,
                assetIn,
                assetOut,
                assets,
                SwapKind.GivenIn,
            );
            expect(mappedRoute).toEqual(expectedRoute);
        });
        test('GivenOut', () => {
            const amountIn = '876543210987654321';
            const amountOut = '123456789112345678';
            singleSwap.kind = SwapKind.GivenOut;
            singleSwap.amount = BigInt(amountOut);
            expectedRoute[0].tokenInAmount = amountIn;
            expectedRoute[0].tokenOutAmount = amountOut;
            expectedRoute[0].hops[0].tokenInAmount = amountIn;
            expectedRoute[0].hops[0].tokenOutAmount = amountOut;
            const mappedRoute = mapRoutes(
                singleSwap,
                amountIn,
                amountOut,
                pools,
                assetIn,
                assetOut,
                assets,
                SwapKind.GivenOut,
            );
            expect(mappedRoute).toEqual(expectedRoute);
        });
    });
    describe('BatchSwap', () => {
        describe('ExactIn', () => {
            let pools: GqlPoolMinimal[];
            let paths: BatchSwapStep[][];
            const assetIn = '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4';
            const assetOut = '0x8159462d255C1D24915CB51ec361F700174cD994';
            const amountIn = '111111111111111111';
            const amountOut = '222222222222222222';
            const batchSwap: BatchSwapStep[] = [
                {
                    poolId: '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                    assetInIndex: BigInt(0),
                    assetOutIndex: BigInt(1),
                    amount: BigInt(amountIn),
                    userData: '0x',
                },
                {
                    poolId: '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                    assetInIndex: BigInt(1),
                    assetOutIndex: BigInt(2),
                    amount: BigInt(0),
                    userData: '0x',
                },
            ];
            const assets = [
                '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                '0x8159462d255C1D24915CB51ec361F700174cD994',
            ];
            const expectedRoute: GqlSorSwapRoute[] = [
                {
                    hops: [
                        {
                            pool: {} as GqlPoolMinimal,
                            poolId: '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                            tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                            tokenInAmount: amountIn,
                            tokenOut: '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                            tokenOutAmount: '0', // TODO - Are we expecting to get the values for intermmediate steps? May need b-sdk to return that?
                        },
                        {
                            pool: {} as GqlPoolMinimal,
                            poolId: '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                            tokenIn: '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                            tokenInAmount: '0',
                            tokenOut: '0x8159462d255C1D24915CB51ec361F700174cD994',
                            tokenOutAmount: amountOut,
                        },
                    ],
                    share: 1,
                    tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                    tokenInAmount: amountIn,
                    tokenOut: '0x8159462d255C1D24915CB51ec361F700174cD994',
                    tokenOutAmount: amountOut,
                },
            ];
            beforeAll(async () => {
                pools = await poolService.getGqlPools({
                    where: {
                        idIn: [
                            '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                            '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                        ],
                    },
                });
                expectedRoute[0].hops[0].pool = pools.find(
                    (p) => p.id === '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                ) as GqlPoolMinimal;
                expectedRoute[0].hops[1].pool = pools.find(
                    (p) => p.id === '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                ) as GqlPoolMinimal;
            });
            describe('Single Path', () => {
                test('splitPaths', () => {
                    paths = splitPaths(batchSwap, assetIn, assetOut, assets, SwapKind.GivenIn);
                    expect(paths.length).toEqual(1);
                    expect(paths[0].length).toEqual(2);
                });
                test('mapBatchSwap', () => {
                    const route = mapBatchSwap(paths[0], amountIn, amountOut, SwapKind.GivenIn, assets, pools);
                    expect(route).toEqual(expectedRoute[0]);
                });
                test('GivenIn', () => {
                    const mappedRoute = mapRoutes(
                        batchSwap,
                        amountIn,
                        amountOut,
                        pools,
                        assetIn,
                        assetOut,
                        assets,
                        SwapKind.GivenIn,
                    );
                    expect(mappedRoute).toEqual(expectedRoute);
                });
            });
            describe('Multiple Paths', () => {
                beforeAll(() => {
                    batchSwap.push({
                        poolId: '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                        assetInIndex: BigInt(0),
                        assetOutIndex: BigInt(2),
                        amount: BigInt(amountIn),
                        userData: '0x',
                    });
                    expectedRoute[0].share = 0.5;
                    expectedRoute.push({
                        hops: [
                            {
                                pool: pools.find(
                                    (p) =>
                                        p.id === '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                                ) as GqlPoolMinimal,
                                poolId: '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                                tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                                tokenInAmount: amountIn,
                                tokenOut: '0x8159462d255C1D24915CB51ec361F700174cD994',
                                tokenOutAmount: amountOut,
                            },
                        ],
                        share: 0.5,
                        tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                        tokenInAmount: amountIn,
                        tokenOut: '0x8159462d255C1D24915CB51ec361F700174cD994',
                        tokenOutAmount: amountOut,
                    });
                });
                test('splitPaths', () => {
                    paths = splitPaths(batchSwap, assetIn, assetOut, assets, SwapKind.GivenIn);
                    expect(paths.length).toEqual(2);
                    expect(paths[0].length).toEqual(2);
                    expect(paths[1].length).toEqual(1);
                });
                test('mapBatchSwap', () => {
                    const route = mapBatchSwap(
                        paths[0],
                        (BigInt(amountIn) * BigInt(2)).toString(),
                        (BigInt(amountOut) * BigInt(2)).toString(),
                        SwapKind.GivenIn,
                        assets,
                        pools,
                    );
                    expect(route).toEqual(expectedRoute[0]);
                });
                test('mapBatchSwap', () => {
                    const route = mapBatchSwap(
                        paths[1],
                        (BigInt(amountIn) * BigInt(2)).toString(),
                        (BigInt(amountOut) * BigInt(2)).toString(),
                        SwapKind.GivenIn,
                        assets,
                        pools,
                    );
                    expect(route).toEqual(expectedRoute[1]);
                });
                test('GivenIn', () => {
                    const mappedRoute = mapRoutes(
                        batchSwap,
                        (BigInt(amountIn) * BigInt(2)).toString(),
                        (BigInt(amountOut) * BigInt(2)).toString(),
                        pools,
                        assetIn,
                        assetOut,
                        assets,
                        SwapKind.GivenIn,
                    );
                    expect(mappedRoute).toEqual(expectedRoute);
                });
            });
        });
        describe('ExactOut', () => {
            let pools: GqlPoolMinimal[];
            let paths: BatchSwapStep[][];
            const assetIn = '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4';
            const assetOut = '0x8159462d255C1D24915CB51ec361F700174cD994';
            const amountIn = '111111111111111111';
            const amountOut = '222222222222222222';
            const batchSwap: BatchSwapStep[] = [
                {
                    poolId: '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                    assetInIndex: BigInt(1),
                    assetOutIndex: BigInt(2),
                    amount: BigInt(amountOut),
                    userData: '0x',
                },
                {
                    poolId: '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                    assetInIndex: BigInt(0),
                    assetOutIndex: BigInt(1),
                    amount: BigInt(0),
                    userData: '0x',
                },
            ];
            const assets = [
                '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                '0x8159462d255C1D24915CB51ec361F700174cD994',
            ];
            const expectedRoute: GqlSorSwapRoute[] = [
                {
                    hops: [
                        {
                            pool: {} as GqlPoolMinimal,
                            poolId: '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                            tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                            tokenInAmount: amountIn,
                            tokenOut: '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                            tokenOutAmount: '0', // TODO - Are we expecting to get the values for intermmediate steps? May need b-sdk to return that?
                        },
                        {
                            pool: {} as GqlPoolMinimal,
                            poolId: '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                            tokenIn: '0xE4885Ed2818Cc9E840A25f94F9b2A28169D1AEA7',
                            tokenInAmount: '0',
                            tokenOut: '0x8159462d255C1D24915CB51ec361F700174cD994',
                            tokenOutAmount: amountOut,
                        },
                    ],
                    share: 1,
                    tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                    tokenInAmount: amountIn,
                    tokenOut: '0x8159462d255C1D24915CB51ec361F700174cD994',
                    tokenOutAmount: amountOut,
                },
            ];

            beforeAll(async () => {
                pools = await poolService.getGqlPools({
                    where: {
                        idIn: [
                            '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                            '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                        ],
                    },
                });
                expectedRoute[0].hops[0].pool = pools.find(
                    (p) => p.id === '0x216690738aac4aa0c4770253ca26a28f0115c595000000000000000000000b2c',
                ) as GqlPoolMinimal;
                expectedRoute[0].hops[1].pool = pools.find(
                    (p) => p.id === '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                ) as GqlPoolMinimal;
            });
            describe('Single Path', () => {
                test('split paths', () => {
                    paths = splitPaths(batchSwap, assetIn, assetOut, assets, SwapKind.GivenOut);
                    expect(paths.length).toEqual(1);
                    expect(paths[0].length).toEqual(2);
                });
                test('mapBatchSwap', () => {
                    const route = mapBatchSwap(paths[0], amountIn, amountOut, SwapKind.GivenOut, assets, pools);
                    expect(route).toEqual(expectedRoute[0]);
                });
                test('GivenOut', () => {
                    const mappedRoute = mapRoutes(
                        batchSwap,
                        amountIn,
                        amountOut,
                        pools,
                        assetIn,
                        assetOut,
                        assets,
                        SwapKind.GivenOut,
                    );
                    expect(mappedRoute).toEqual(expectedRoute);
                });
            });
            describe('Multi Paths', () => {
                beforeAll(() => {
                    batchSwap.push({
                        poolId: '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                        assetInIndex: BigInt(0),
                        assetOutIndex: BigInt(2),
                        amount: BigInt(amountOut),
                        userData: '0x',
                    });
                    expectedRoute[0].share = 0.5;
                    expectedRoute.unshift({
                        hops: [
                            {
                                pool: pools.find(
                                    (p) =>
                                        p.id === '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                                ) as GqlPoolMinimal,
                                poolId: '0x8159462d255c1d24915cb51ec361f700174cd99400000000000000000000075d',
                                tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                                tokenInAmount: amountIn,
                                tokenOut: '0x8159462d255C1D24915CB51ec361F700174cD994',
                                tokenOutAmount: amountOut,
                            },
                        ],
                        share: 0.5,
                        tokenIn: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
                        tokenInAmount: amountIn,
                        tokenOut: '0x8159462d255C1D24915CB51ec361F700174cD994',
                        tokenOutAmount: amountOut,
                    });
                });
                test('splitPaths', () => {
                    paths = splitPaths(batchSwap, assetIn, assetOut, assets, SwapKind.GivenOut);
                    expect(paths.length).toEqual(2);
                    expect(paths[0].length).toEqual(1);
                    expect(paths[1].length).toEqual(2);
                });
                test('mapBatchSwap', () => {
                    const route = mapBatchSwap(
                        paths[0],
                        (BigInt(amountIn) * BigInt(2)).toString(),
                        (BigInt(amountOut) * BigInt(2)).toString(),
                        SwapKind.GivenOut,
                        assets,
                        pools,
                    );
                    expect(route).toEqual(expectedRoute[0]);
                });
                test('mapBatchSwap', () => {
                    const route = mapBatchSwap(
                        paths[1],
                        (BigInt(amountIn) * BigInt(2)).toString(),
                        (BigInt(amountOut) * BigInt(2)).toString(),
                        SwapKind.GivenOut,
                        assets,
                        pools,
                    );
                    expect(route).toEqual(expectedRoute[1]);
                });
                test('GivenOut', () => {
                    const mappedRoute = mapRoutes(
                        batchSwap,
                        (BigInt(amountIn) * BigInt(2)).toString(),
                        (BigInt(amountOut) * BigInt(2)).toString(),
                        pools,
                        assetIn,
                        assetOut,
                        assets,
                        SwapKind.GivenOut,
                    );
                    expect(mappedRoute).toEqual(expectedRoute);
                });
            });
        });
    });
});
