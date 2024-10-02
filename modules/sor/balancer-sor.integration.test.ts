// yarn vitest balancer-sor.integration.test.ts

import { ExactInQueryOutput, Swap, SwapKind, Token, Address, Path } from '@balancer/sdk';

import { PathWithAmount } from './sorV2/lib/path';
import { sorGetPathsWithPools } from './sorV2/lib/static';
import { getOutputAmount } from './sorV2/lib/utils/helpers';
import { chainToIdMap } from '../network/network-config';

import { ANVIL_NETWORKS, startFork, stopAnvilForks } from '../../test/anvil/anvil-global-setup';
import {
    prismaPoolDynamicDataFactory,
    prismaPoolFactory,
    prismaPoolTokenDynamicDataFactory,
    prismaPoolTokenFactory,
    hookDataFactory,
    hookFactory
} from '../../test/factories';
import { createTestClient, formatEther, Hex, http, parseEther, TestClient } from 'viem';
import { sepolia } from 'viem/chains';

/**
 * Test Data:
 *
 * In order to properly compare SOR quotes vs SDK queries, we need to setup test data from a specific blockNumber.
 * Although the API does not provide that functionality, we can use subgraph to achieve it.
 * These tests run against the 6th testnet deployment and these are their respective subgraphs:
 * - data common to all pools: [balancer subgraph](https://api.studio.thegraph.com/proxy/31386/balancer-v3-sepolia-6th/version/latest/graphql)
 *   - tokens (address, balance, decimals)
 *   - totalShares
 *   - swapFee
 * - data specific to each pool type: [pools subgraph](https://api.studio.thegraph.com/proxy/31386/balancer-pools-v3-sepolia-6th/version/latest/graphql)
 *   - weight
 *   - amp
 * The only item missing from subgraph is priceRate, which can be fetched from a Tenderly simulation (getPoolTokenRates)
 * against the VaultExplorer contract (0x72ebafddc4c7d3eb702c81295d90a8b29f008a03).
 *
 * TODO: improve test data setup by creating a script that fetches all necessary data automatically for a given blockNumber.
 */

const protocolVersion = 3;

describe('Balancer SOR Integration Tests', () => {
    let rpcUrl: string;
    let paths: PathWithAmount[];
    let sdkSwap: Swap;
    let snapshot: Hex;
    let client: TestClient;

    beforeAll(async () => {
        // start fork to run queries against
        ({ rpcUrl } = await startFork(ANVIL_NETWORKS.SEPOLIA, undefined, BigInt(6422808)));
        client = createTestClient({
            mode: 'anvil',
            chain: sepolia,
            transport: http(rpcUrl),
        });
        snapshot = await client.snapshot();
    });

    beforeEach(async () => {
        await client.revert({
            id: snapshot,
        });
        snapshot = await client.snapshot();
    });

    describe('Weighted Pool Path', () => {
        beforeAll(async () => {
            // setup mock pool data
            const WETH = prismaPoolTokenFactory.build({
                address: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '0.005',
                    weight: '0.5',
                }),
            });
            const BAL = prismaPoolTokenFactory.build({
                address: '0xb19382073c7a0addbb56ac6af1808fa49e377b75',
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '5',
                    weight: '0.5',
                }),
            });
            const prismaWeightedPool = prismaPoolFactory.build({
                address: '0x03bf996c7bd45b3386cb41875761d45e27eab284',
                type: 'WEIGHTED',
                protocolVersion,
                tokens: [WETH, BAL],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '0.158113883008415798',
                    swapFee: '0.1',
                }),
            });

            // get SOR paths
            const tIn = new Token(parseFloat(chainToIdMap['SEPOLIA']), BAL.address as Address, 18);
            const tOut = new Token(parseFloat(chainToIdMap['SEPOLIA']), WETH.address as Address, 18);
            const amountIn = BigInt(0.1e18);
            paths = (await sorGetPathsWithPools(
                tIn,
                tOut,
                SwapKind.GivenIn,
                amountIn,
                [prismaWeightedPool],
                protocolVersion,
            )) as PathWithAmount[];

            // build SDK swap from SOR paths
            sdkSwap = new Swap({
                chainId: parseFloat(chainToIdMap['SEPOLIA']),
                paths: paths.map((path) => ({
                    protocolVersion,
                    inputAmountRaw: path.inputAmount.amount,
                    outputAmountRaw: path.outputAmount.amount,
                    tokens: path.tokens.map((token) => ({
                        address: token.address,
                        decimals: token.decimals,
                    })),
                    pools: path.pools.map((pool) => pool.id),
                })),
                swapKind: SwapKind.GivenIn,
            });
        });

        test('SOR quote should match swap query', async () => {
            const returnAmountSOR = getOutputAmount(paths);
            const queryOutput = await sdkSwap.query(rpcUrl);
            const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
            expect(returnAmountQuery.amount).toEqual(returnAmountSOR.amount);
        });
    });

    describe('Stable Pool Path', () => {
        beforeAll(async () => {
            // setup mock pool data
            const poolAddress = '0x302b75a27e5e157f93c679dd7a25fdfcdbc1473c';
            const stataUSDC = prismaPoolTokenFactory.build({
                address: '0x8a88124522dbbf1e56352ba3de1d9f78c143751e',
                token: { decimals: 6 },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '500',
                    priceRate: '1.046992819427282715',
                }),
            });
            const stataDAI = prismaPoolTokenFactory.build({
                address: '0xde46e43f46ff74a23a65ebb0580cbe3dfe684a17',
                token: { decimals: 18 },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '500',
                    priceRate: '1.101882285912091736',
                }),
            });
            const prismaStablePool = prismaPoolFactory.stable('1000').build({
                address: poolAddress,
                tokens: [stataUSDC, stataDAI],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '1054.451151293881721519',
                    swapFee: '0.01',
                }),
            });

            // get SOR paths
            const tIn = new Token(
                parseFloat(chainToIdMap[stataUSDC.token.chain]),
                stataUSDC.address as Address,
                stataUSDC.token.decimals,
            );
            const tOut = new Token(
                parseFloat(chainToIdMap[stataDAI.token.chain]),
                stataDAI.address as Address,
                stataDAI.token.decimals,
            );
            const amountIn = BigInt(1000e6);
            paths = (await sorGetPathsWithPools(
                tIn,
                tOut,
                SwapKind.GivenIn,
                amountIn,
                [prismaStablePool],
                protocolVersion,
            )) as PathWithAmount[];

            const swapPaths: Path[] = paths.map((path) => ({
                protocolVersion,
                inputAmountRaw: path.inputAmount.amount,
                outputAmountRaw: path.outputAmount.amount,
                tokens: path.tokens.map((token) => ({
                    address: token.address,
                    decimals: token.decimals,
                })),
                pools: path.pools.map((pool) => pool.id),
            }));

            // build SDK swap from SOR paths
            sdkSwap = new Swap({
                chainId: parseFloat(chainToIdMap['SEPOLIA']),
                paths: swapPaths,
                swapKind: SwapKind.GivenIn,
            });
        });

        test('SOR quote should match swap query', async () => {
            const returnAmountSOR = getOutputAmount(paths);
            const queryOutput = await sdkSwap.query(rpcUrl);
            const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
            expect(returnAmountQuery.amount).toEqual(returnAmountSOR.amount);
        });
    });

    describe('Add/Remove Liquidity Paths', () => {
        let stataUSDC: ReturnType<typeof prismaPoolTokenFactory.build>;
        let WETH: ReturnType<typeof prismaPoolTokenFactory.build>;
        let nestedPool: ReturnType<typeof prismaPoolFactory.build>;
        let weightedPool: ReturnType<typeof prismaPoolFactory.build>;

        beforeAll(async () => {
            // setup mock pool data
            const nestedPoolAddress = '0x302b75a27e5e157f93c679dd7a25fdfcdbc1473c';
            stataUSDC = prismaPoolTokenFactory.build({
                address: '0x8a88124522dbbf1e56352ba3de1d9f78c143751e',
                token: { decimals: 6 },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '500',
                    priceRate: '1.046992819427282715',
                }),
            });
            const DAI = prismaPoolTokenFactory.build({
                address: '0xde46e43f46ff74a23a65ebb0580cbe3dfe684a17',
                token: { decimals: 18 },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '500',
                    priceRate: '1.101882285912091736',
                }),
            });
            nestedPool = prismaPoolFactory.stable('1000').build({
                address: nestedPoolAddress,
                tokens: [stataUSDC, DAI],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '1054.451151293881721519',
                    swapFee: '0.01',
                }),
            });

            const weightedPoolAddress = '0x9e4fd17682b3f15e50c9fddfa08aa12974d0acf5';
            const DAI_USDC_BPT = prismaPoolTokenFactory.build({
                address: '0x302b75a27e5e157f93c679dd7a25fdfcdbc1473c',
                token: { decimals: 18 },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '100',
                }),
            });
            WETH = prismaPoolTokenFactory.build({
                address: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
                token: { decimals: 18 },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '0.03',
                }),
            });
            weightedPool = prismaPoolFactory.build({
                address: weightedPoolAddress,
                tokens: [DAI_USDC_BPT, WETH],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '1.732050807568842627',
                    swapFee: '0.01',
                }),
            });
        });

        // usdc [add] bpt [swap] weth
        describe('Add Liquidity Path', () => {
            beforeAll(async () => {
                // get SOR paths
                const tIn = new Token(
                    parseFloat(chainToIdMap[stataUSDC.token.chain]),
                    stataUSDC.address as Address,
                    stataUSDC.token.decimals,
                );
                const tOut = new Token(
                    parseFloat(chainToIdMap[WETH.token.chain]),
                    WETH.address as Address,
                    WETH.token.decimals,
                );
                const amountIn = BigInt(10e6);
                paths = (await sorGetPathsWithPools(
                    tIn,
                    tOut,
                    SwapKind.GivenIn,
                    amountIn,
                    [nestedPool, weightedPool],
                    protocolVersion,
                )) as PathWithAmount[];

                const swapPaths: Path[] = paths.map((path) => ({
                    protocolVersion,
                    inputAmountRaw: path.inputAmount.amount,
                    outputAmountRaw: path.outputAmount.amount,
                    tokens: path.tokens.map((token) => ({
                        address: token.address,
                        decimals: token.decimals,
                    })),
                    pools: path.pools.map((pool) => pool.id),
                }));

                // build SDK swap from SOR paths
                sdkSwap = new Swap({
                    chainId: parseFloat(chainToIdMap['SEPOLIA']),
                    paths: swapPaths,
                    swapKind: SwapKind.GivenIn,
                });
            });

            test('SOR quote should match swap query', async () => {
                const returnAmountSOR = getOutputAmount(paths);
                const queryOutput = await sdkSwap.query(rpcUrl);
                const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
                expect(returnAmountQuery.amount).toEqual(returnAmountSOR.amount);
            });
        });

        // weth [swap] bpt [remove] usdc
        describe('Remove Liquidity Path', () => {
            beforeAll(async () => {
                // get SOR paths
                const tIn = new Token(
                    parseFloat(chainToIdMap[WETH.token.chain]),
                    WETH.address as Address,
                    WETH.token.decimals,
                );
                const tOut = new Token(
                    parseFloat(chainToIdMap[stataUSDC.token.chain]),
                    stataUSDC.address as Address,
                    stataUSDC.token.decimals,
                );
                const amountIn = parseEther('0.0001');
                paths = (await sorGetPathsWithPools(
                    tIn,
                    tOut,
                    SwapKind.GivenIn,
                    amountIn,
                    [nestedPool, weightedPool],
                    protocolVersion,
                )) as PathWithAmount[];

                const swapPaths: Path[] = paths.map((path) => ({
                    protocolVersion,
                    inputAmountRaw: path.inputAmount.amount,
                    outputAmountRaw: path.outputAmount.amount,
                    tokens: path.tokens.map((token) => ({
                        address: token.address,
                        decimals: token.decimals,
                    })),
                    pools: path.pools.map((pool) => pool.id),
                }));

                // build SDK swap from SOR paths
                sdkSwap = new Swap({
                    chainId: parseFloat(chainToIdMap['SEPOLIA']),
                    paths: swapPaths,
                    swapKind: SwapKind.GivenIn,
                });
            });

            test('SOR quote should match swap query', async () => {
                const returnAmountSOR = getOutputAmount(paths);
                const queryOutput = await sdkSwap.query(rpcUrl);
                const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
                expect(returnAmountQuery.amount).toEqual(returnAmountSOR.amount);
            });
        });
    });

    describe('Buffer Pool Path', () => {
        beforeAll(async () => {
            // setup mock pool data
            const poolAddress = '0x302b75a27e5e157f93c679dd7a25fdfcdbc1473c';
            const stataUSDC = prismaPoolTokenFactory.build({
                address: '0x8a88124522dbbf1e56352ba3de1d9f78c143751e',
                token: { decimals: 6, underlyingTokenAddress: '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8' },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '500',
                    priceRate: '1.046992819427282715',
                }),
            });
            const stataDAI = prismaPoolTokenFactory.build({
                address: '0xde46e43f46ff74a23a65ebb0580cbe3dfe684a17',
                token: { decimals: 18, underlyingTokenAddress: '0xff34b3d4aee8ddcd6f9afffb6fe49bd371b8a357' },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '500',
                    priceRate: '1.101882285912091736',
                }),
            });
            const prismaStablePool = prismaPoolFactory.stable('1000').build({
                address: poolAddress,
                tokens: [stataUSDC, stataDAI],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '1054.451151293881721519',
                    swapFee: '0.01',
                }),
            });

            // get SOR paths
            const tIn = new Token(
                parseFloat(chainToIdMap[stataUSDC.token.chain]),
                stataUSDC.token.underlyingTokenAddress as Address, // USDC
                stataUSDC.token.decimals,
            );
            const tOut = new Token(
                parseFloat(chainToIdMap[stataDAI.token.chain]),
                stataDAI.token.underlyingTokenAddress as Address, // DAI
                stataDAI.token.decimals,
            );
            const amountIn = BigInt(10e6);
            paths = (await sorGetPathsWithPools(
                tIn,
                tOut,
                SwapKind.GivenIn,
                amountIn,
                [prismaStablePool],
                protocolVersion,
            )) as PathWithAmount[];

            const swapPaths: Path[] = paths.map((path) => ({
                protocolVersion,
                inputAmountRaw: path.inputAmount.amount,
                outputAmountRaw: path.outputAmount.amount,
                tokens: path.tokens.map((token) => ({
                    address: token.address,
                    decimals: token.decimals,
                })),
                pools: path.pools.map((pool) => pool.id),
                isBuffer: path.isBuffer,
            }));

            // build SDK swap from SOR paths
            sdkSwap = new Swap({
                chainId: parseFloat(chainToIdMap['SEPOLIA']),
                paths: swapPaths,
                swapKind: SwapKind.GivenIn,
            });
        });

        test('SOR quote should match swap query', async () => {
            const returnAmountSOR = getOutputAmount(paths);
            const queryOutput = await sdkSwap.query(rpcUrl);
            const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
            const returnAmountQueryFloat = parseFloat(formatEther(returnAmountQuery.amount));
            const returnAmountSORFloat = parseFloat(formatEther(returnAmountSOR.amount));
            expect(returnAmountQueryFloat).toBeCloseTo(returnAmountSORFloat, 2);
        });
    });

    describe('Pools Path with hooks', async () => {
        let WETH, BAL, stataDAI, stataUSDC: ReturnType<typeof prismaPoolTokenFactory.build>;
        let prismaWeightedPool, prismaStablePool: ReturnType<typeof prismaPoolFactory.build>;
        let exitFeeHook, directionalFeeHook: ReturnType<typeof hookFactory.build>;

        beforeAll(async() => {
            // setup mock pool data - Weighted
            WETH = prismaPoolTokenFactory.build({
                address: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '0.005',
                    weight: '0.5',
                }),
            });
            BAL = prismaPoolTokenFactory.build({
                address: '0xb19382073c7a0addbb56ac6af1808fa49e377b75',
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '5',
                    weight: '0.5',
                }),
            });
            stataDAI = prismaPoolTokenFactory.build({
                address: '0xde46e43f46ff74a23a65ebb0580cbe3dfe684a17',
                token: { decimals: 18 },
            });
            stataUSDC = prismaPoolTokenFactory.build({
                address: '0x8a88124522dbbf1e56352ba3de1d9f78c143751e',
                token: { decimals: 6 },
            });
            const dynamicData = {
                // Add any specific dynamic data parameters here
                addLiquidityFeePercentage: '0.01',
                removeLiquidityFeePercentage: '0.01',
                swapFeePercentage: '0.01'
            };
            exitFeeHook = hookFactory.build({
                name: 'ExitFeeHook',
                dynamicData: dynamicData,
                enableHookAdjustedAmounts: true,
                pools: [prismaWeightedPool],
                shouldCallAfterAddLiquidity: true,
                shouldCallAfterInitialize: true,
                shouldCallAfterRemoveLiquidity: true,
                shouldCallAfterSwap: true,
                shouldCallBeforeAddLiquidity: true,
                shouldCallBeforeInitialize: true,
                shouldCallBeforeRemoveLiquidity: true,
                shouldCallBeforeSwap: true,
                shouldCallComputeDynamicSwapFee: true,
            });
            directionalFeeHook = hookFactory.build({
                name: 'DirectionalFeeHook',
                dynamicData: dynamicData,
                enableHookAdjustedAmounts: true,
                pools: [prismaStablePool],
                shouldCallAfterAddLiquidity: true,
                shouldCallAfterInitialize: true,
                shouldCallAfterRemoveLiquidity: true,
                shouldCallAfterSwap: true,
                shouldCallBeforeAddLiquidity: true,
                shouldCallBeforeInitialize: true,
                shouldCallBeforeRemoveLiquidity: true,
                shouldCallBeforeSwap: true,
                shouldCallComputeDynamicSwapFee: true,
            });
            // this pool has an exitFee hook
            prismaWeightedPool = prismaPoolFactory.build({
                address: '0xc7436329da34B54fAD1400f400931751E1D06Cf8',
                type: 'WEIGHTED',
                protocolVersion,
                tokens: [WETH, BAL],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '0.158113883008415798',
                    swapFee: '0.1',
                }),
                hook: exitFeeHook,
            });
            prismaStablePool = prismaPoolFactory.stable('1000').build({
                address: '0x302b75a27e5e157f93c679dd7a25fdfcdbc1473c',
                tokens: [stataUSDC, stataDAI],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '1054.451151293881721519',
                    swapFee: '0.01',
                }),
                hook: exitFeeHook,
            });
        })
        test.only('SOR quote should match swap query with hooks', async () => {
            // This test does not trigger the ExitFeeHook, as the ExitFee is
            // applied on RemoveLiquidity operations
            const tIn = new Token(
                parseFloat(chainToIdMap[BAL.token.chain]),
                BAL.address as Address,
                BAL.token.decimals,
            );
            const tOut = new Token(
                parseFloat(chainToIdMap[WETH.token.chain]),
                WETH.address as Address,
                WETH.token.decimals,
            );
            const amountIn = BigInt(1000e6);
            paths = (await sorGetPathsWithPools(
                tIn,
                tOut,
                SwapKind.GivenIn,
                amountIn,
                [prismaStablePool, prismaWeightedPool],
                protocolVersion,
            )) as PathWithAmount[];

            const swapPaths: Path[] = paths.map((path) => ({
                protocolVersion,
                inputAmountRaw: path.inputAmount.amount,
                outputAmountRaw: path.outputAmount.amount,
                tokens: path.tokens.map((token) => ({
                    address: token.address,
                    decimals: token.decimals,
                })),
                pools: path.pools.map((pool) => pool.id),
            }));

            // build SDK swap from SOR paths
            sdkSwap = new Swap({
                chainId: parseFloat(chainToIdMap['SEPOLIA']),
                paths: swapPaths,
                swapKind: SwapKind.GivenIn,
            });

            const returnAmountSOR = getOutputAmount(paths);
            const queryOutput = await sdkSwap.query(rpcUrl);
            const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
            expect(returnAmountQuery.amount).toEqual(returnAmountSOR.amount);
        });
        test.skip('SOR quote should match swap query with hook logic used', async () => {
            // This test applies the hook logic, as a BPT -> Token Swap will trigger
            // a RemoveLiquidity operation.
            const tIn = new Token(
                parseFloat('11155111'),
                prismaWeightedPool.address as Address,
                prismaWeightedPool.decimals,
            );
            const tOut = new Token(
                parseFloat(chainToIdMap[WETH.token.chain]),
                WETH.address as Address,
                WETH.token.decimals,
            );
            const amountIn = BigInt(1000e6);
            paths = (await sorGetPathsWithPools(
                tIn,
                tOut,
                SwapKind.GivenIn,
                amountIn,
                [prismaStablePool, prismaWeightedPool],
                protocolVersion,
            )) as PathWithAmount[];

            const swapPaths: Path[] = paths.map((path) => ({
                protocolVersion,
                inputAmountRaw: path.inputAmount.amount,
                outputAmountRaw: path.outputAmount.amount,
                tokens: path.tokens.map((token) => ({
                    address: token.address,
                    decimals: token.decimals,
                })),
                pools: path.pools.map((pool) => pool.id),
            }));

            // build SDK swap from SOR paths
            sdkSwap = new Swap({
                chainId: parseFloat(chainToIdMap['SEPOLIA']),
                paths: swapPaths,
                swapKind: SwapKind.GivenIn,
            });

            const returnAmountSOR = getOutputAmount(paths);
            const queryOutput = await sdkSwap.query(rpcUrl);
            const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
            expect(returnAmountQuery.amount).toEqual(returnAmountSOR.amount);
        });
    });
    afterAll(async () => {
        await stopAnvilForks();
    });
});
