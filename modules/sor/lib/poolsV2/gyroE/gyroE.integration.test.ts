// yarn vitest gyroE.integration.test.ts

import { ExactInQueryOutput, Swap, SwapKind, Token, Address, ExactOutQueryOutput, ChainId } from '@balancer/sdk';
import { createTestClient, formatUnits, Hex, http, parseUnits, TestClient } from 'viem';
import { gnosis, sonic } from 'viem/chains';

import { PrismaPoolAndHookWithDynamic } from '../../../../../prisma/prisma-types';

import { PathWithAmount } from '../../path';
import { SOR } from '../../sor';
import { getOutputAmount, getInputAmount } from '../../utils/helpers';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';

import { ANVIL_NETWORKS, startFork, stopAnvilForks } from '../../../../../test/anvil/anvil-global-setup';
import { prismaPoolDynamicDataFactory, prismaPoolFactory, prismaPoolTokenFactory } from '../../../../../test/factories';

const protocolVersion = 2;

describe('SOR - GyroE Integration Tests', () => {
    let rpcUrl: string;
    let paths: PathWithAmount[];
    let sdkSwap: Swap;
    let snapshot: Hex;
    let client: TestClient;
    let chainId: number;
    let prismaPool: PrismaPoolAndHookWithDynamic;
    let tIn: Token;
    let tOut: Token;

    beforeEach(async () => {
        await client.revert({
            id: snapshot,
        });
        snapshot = await client.snapshot();
    });

    describe('SONIC', () => {
        beforeAll(async () => {
            // start fork to run queries against
            chainId = parseFloat(chainToIdMap['SONIC']);
            ({ rpcUrl } = await startFork(ANVIL_NETWORKS.SONIC));
            client = createTestClient({
                mode: 'anvil',
                chain: sonic,
                transport: http(rpcUrl),
            });
            // setup mock pool data
            const scETH = prismaPoolTokenFactory.build({
                address: '0x3bce5cb273f0f148010bbea2470e7b5df84c7812',
                balance: '257.286831495767212135',
                priceRate: '3300',
            });
            const scUSD = prismaPoolTokenFactory.build({
                address: '0xd3dce716f3ef535c5ff8d041c1a41c3bd89b97ae',
                balance: '261930.959196',
                token: {
                    decimals: 6,
                },
            });
            prismaPool = prismaPoolFactory
                .gyroE({
                    id: '0xe7734b495a552ab6f4c78406e672cca7175181e10002000000000000000000c5',
                    alpha: '0.42424242',
                    beta: '0.9090909',
                    c: '0.791285002436294737',
                    s: '0.611447499724541381',
                    lambda: '1',
                    tauAlphaX: '-0.2538511957760697060105475605180052',
                    tauAlphaY: '0.967243283979299351698899689234876',
                    tauBetaX: '0.07984138065077215533782444860237401',
                    tauBetaY: '0.9968075811989887277476981006393931',
                    u: '0.1614502244146482697173624335600013',
                    v: '0.9782964299802404659367501132889027',
                    w: '0.01430407134582051721445197790463087',
                    z: '-0.044915610502046350118400771471305022',
                    dSq: '1.000000000000000000063494496315286',
                })
                .build({
                    address: '0xe7734b495a552ab6f4c78406e672cca7175181e1',
                    protocolVersion,
                    tokens: [scETH, scUSD],
                    dynamicData: prismaPoolDynamicDataFactory.build({
                        totalShares: '798486.550274582727820428',
                        swapFee: '0.003',
                    }),
                });

            tIn = new Token(chainId, scUSD.address as Address, scUSD.token.decimals);
            tOut = new Token(chainId, scETH.address as Address, scETH.token.decimals);

            snapshot = await client.snapshot();
        });

        describe('Swap Given In', () => {
            beforeAll(async () => {
                // get SOR paths
                const amountIn = parseUnits('100', tIn.decimals);
                const swapKind = SwapKind.GivenIn;
                paths = (await SOR.getPathsWithPools(
                    tIn,
                    tOut,
                    swapKind,
                    amountIn,
                    [prismaPool],
                    [],
                    protocolVersion,
                )) as PathWithAmount[];

                // build SDK swap from SOR paths
                sdkSwap = new Swap({
                    chainId,
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
                    swapKind,
                });
            });

            test('SOR quote should match swap query', async () => {
                const returnAmountSOR = getOutputAmount(paths);
                const queryOutput = await sdkSwap.query(rpcUrl);
                const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
                const returnAmountQueryFloat = parseFloat(formatUnits(returnAmountQuery.amount, tOut.decimals));
                const returnAmountSORFloat = parseFloat(formatUnits(returnAmountSOR.amount, tOut.decimals));
                expect(returnAmountQueryFloat).toBeCloseTo(returnAmountSORFloat, tOut.decimals - 2);
            });
        });

        describe('Swap Given Out', () => {
            beforeAll(async () => {
                // get SOR paths
                const amountOut = parseUnits('1', tOut.decimals);
                const swapKind = SwapKind.GivenOut;
                paths = (await SOR.getPathsWithPools(
                    tIn,
                    tOut,
                    swapKind,
                    amountOut,
                    [prismaPool],
                    [],
                    protocolVersion,
                )) as PathWithAmount[];

                // build SDK swap from SOR paths
                sdkSwap = new Swap({
                    chainId,
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
                    swapKind,
                });
            });

            test('SOR quote should match swap query', async () => {
                const returnAmountSOR = getInputAmount(paths);
                const queryOutput = await sdkSwap.query(rpcUrl);
                const returnAmountQuery = (queryOutput as ExactOutQueryOutput).expectedAmountIn;
                const returnAmountQueryFloat = parseFloat(formatUnits(returnAmountQuery.amount, tIn.decimals));
                const returnAmountSORFloat = parseFloat(formatUnits(returnAmountSOR.amount, tIn.decimals));
                expect(returnAmountQueryFloat).toBeCloseTo(returnAmountSORFloat, tIn.decimals - 2);
            });
        });
    });

    describe('GNOSIS', () => {
        beforeAll(async () => {
            // start fork to run queries against
            chainId = parseFloat(chainToIdMap['GNOSIS']);
            ({ rpcUrl } = await startFork(ANVIL_NETWORKS.GNOSIS_CHAIN, undefined, 39000387n));
            client = createTestClient({
                mode: 'anvil',
                chain: gnosis,
                transport: http(rpcUrl),
            });
            // setup mock pool data
            const bCSPX = prismaPoolTokenFactory.build({
                address: '0x1e2c4fb7ede391d116e6b41cd0608260e8801d59',
                balance: '4126.287023871258188766',
                priceRate: '650.000000000000000000',
            });
            const sDAI = prismaPoolTokenFactory.build({
                address: '0xaf204776c7245bf4147c2612bf6e5972ee483701',
                balance: '1717192.407097932059228314',
                priceRate: '1.165240620257615759',
            });
            prismaPool = prismaPoolFactory
                .gyroE({
                    id: '0x1acd5c5e69dc056649d698046486fb54545ce7e4000200000000000000000117',
                    alpha: '0.7',
                    beta: '1.3',
                    c: '0.707106781186547524',
                    s: '0.707106781186547524',
                    lambda: '1',
                    tauAlphaX: '-0.17378533390904767196396190604716688',
                    tauAlphaY: '0.984783558817936807795784134267279',
                    tauBetaX: '0.1293391840677680520489165354049038',
                    tauBetaY: '0.9916004111862217323750267714375956',
                    u: '0.1515622589884078618346041354467426',
                    v: '0.9881919850020792689650338303356912',
                    w: '0.003408426184142462285756984496121705',
                    z: '-0.022223074920639809932327072642593141',
                    dSq: '0.9999999999999999988662409334210612',
                })
                .build({
                    address: '0x1acd5c5e69dc056649d698046486fb54545ce7e4',
                    protocolVersion,
                    tokens: [bCSPX, sDAI],
                    dynamicData: prismaPoolDynamicDataFactory.build({
                        totalShares: '4650911.225696036503869554',
                        swapFee: '0.001',
                    }),
                });

            tIn = new Token(chainId, sDAI.address as Address, sDAI.token.decimals);
            tOut = new Token(chainId, bCSPX.address as Address, bCSPX.token.decimals);

            snapshot = await client.snapshot();
        });

        describe('Swap Given In', () => {
            beforeAll(async () => {
                // get SOR paths
                const amountIn = parseUnits('100000', tIn.decimals);
                const swapKind = SwapKind.GivenIn;
                paths = (await SOR.getPathsWithPools(
                    tIn,
                    tOut,
                    swapKind,
                    amountIn,
                    [prismaPool],
                    [],
                    protocolVersion,
                )) as PathWithAmount[];

                // build SDK swap from SOR paths
                sdkSwap = new Swap({
                    chainId,
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
                    swapKind,
                });
            });

            test('SOR quote should match swap query', async () => {
                const returnAmountSOR = getOutputAmount(paths);
                const queryOutput = await sdkSwap.query(rpcUrl);
                const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
                const returnAmountQueryFloat = parseFloat(formatUnits(returnAmountQuery.amount, tOut.decimals));
                const returnAmountSORFloat = parseFloat(formatUnits(returnAmountSOR.amount, tOut.decimals));
                expect(returnAmountQueryFloat).toBeCloseTo(returnAmountSORFloat, tOut.decimals - 2);
            });
        });

        describe('Swap Given Out', () => {
            beforeAll(async () => {
                // get SOR paths
                const amountOut = parseUnits('190', tOut.decimals);
                const swapKind = SwapKind.GivenOut;
                paths = (await SOR.getPathsWithPools(
                    tIn,
                    tOut,
                    swapKind,
                    amountOut,
                    [prismaPool],
                    [],
                    protocolVersion,
                )) as PathWithAmount[];

                // build SDK swap from SOR paths
                sdkSwap = new Swap({
                    chainId,
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
                    swapKind,
                });
            });

            test('SOR quote should match swap query', async () => {
                const returnAmountSOR = getInputAmount(paths);
                const queryOutput = await sdkSwap.query(rpcUrl);
                const returnAmountQuery = (queryOutput as ExactOutQueryOutput).expectedAmountIn;
                const returnAmountQueryFloat = parseFloat(formatUnits(returnAmountQuery.amount, tIn.decimals));
                const returnAmountSORFloat = parseFloat(formatUnits(returnAmountSOR.amount, tIn.decimals));
                expect(returnAmountQueryFloat).toBeCloseTo(returnAmountSORFloat, tIn.decimals - 2);
            });
        });
    });

    afterAll(async () => {
        await stopAnvilForks();
    });
});
