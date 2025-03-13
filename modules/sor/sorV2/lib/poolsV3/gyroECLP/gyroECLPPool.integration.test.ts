// yarn vitest gyroECLPPool.integration.test.ts

import {
    ExactInQueryOutput,
    Swap,
    SwapKind,
    Token,
    Address,
    ExactOutQueryOutput,
    ChainId,
    CHAINS,
} from '@balancer/sdk';
import { createTestClient, Hex, http, parseUnits, TestClient } from 'viem';

import { PrismaPoolAndHookWithDynamic } from '../../../../../../prisma/prisma-types';

import { PathWithAmount } from '../../path';
import { sorGetPathsWithPools } from '../../static';
import { getOutputAmount, getInputAmount } from '../../utils/helpers';
import { chainToChainId as chainToIdMap } from '../../../../../network/chain-id-to-chain';

import { ANVIL_NETWORKS, startFork, stopAnvilForks } from '../../../../../../test/anvil/anvil-global-setup';
import {
    prismaPoolDynamicDataFactory,
    prismaPoolFactory,
    prismaPoolTokenFactory,
} from '../../../../../../test/factories';

const protocolVersion = 3;

describe('SOR V3 - GyroECLP Integration Tests', () => {
    let rpcUrl: string;
    let paths: PathWithAmount[];
    let sdkSwap: Swap;
    let snapshot: Hex;
    let client: TestClient;
    let chainId: number;
    let prismaPool: PrismaPoolAndHookWithDynamic;
    let tIn: Token;
    let tOut: Token;

    beforeAll(async () => {
        // start fork to run queries against
        chainId = parseFloat(chainToIdMap['SEPOLIA']);
        ({ rpcUrl } = await startFork(ANVIL_NETWORKS.SEPOLIA));
        client = createTestClient({
            mode: 'anvil',
            chain: CHAINS[chainId],
            transport: http(rpcUrl),
        });
        // setup mock pool data
        const USDC = prismaPoolTokenFactory.build({
            address: '0x80d6d3946ed8a1da4e226aa21ccddc32bd127d1a',
            balance: '1',
            token: {
                decimals: 6,
            },
        });
        const DAI = prismaPoolTokenFactory.build({
            address: '0xb77eb1a70a96fdaaeb31db1b42f2b8b5846b2613',
            balance: '1',
        });
        prismaPool = prismaPoolFactory
            .gyroE({
                id: '0xd0bf6e2d49fd48a784896b9a41976260745cce8b',
                alpha: '0.978502246630054917',
                beta: '1.010200040008001600',
                c: '0.707106781186547524',
                s: '0.707106781186547524',
                lambda: '1000.000000000000000000',
                tauAlphaX: '-0.99579168032814905374385588903901421351',
                tauAlphaY: '0.09164567305247642580897554123630647895',
                tauBetaX: '0.98112818242891813219449962634412838733',
                tauBetaY: '0.19335844859671257754549749878387404950',
                u: '0.98845993137853359184850234854116310764',
                v: '0.14250206082459450151567351654402283325',
                w: '0.05085638777211807581060208804369063618',
                z: '-0.00733174894961546076636569450193577293',
                dSq: '0.99999999999999999886624093342106115200',
            })
            .build({
                address: '0xd0bf6e2d49fd48a784896b9a41976260745cce8b',
                protocolVersion,
                tokens: [USDC, DAI],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '0.001431966423464829',
                    swapFee: '0.003',
                }),
            });

        tIn = new Token(chainId, USDC.address as Address, USDC.token.decimals);
        tOut = new Token(chainId, DAI.address as Address, DAI.token.decimals);

        snapshot = await client.snapshot();
    });

    beforeEach(async () => {
        await client.revert({
            id: snapshot,
        });
        snapshot = await client.snapshot();
    });

    describe('Swap Given In', () => {
        beforeAll(async () => {
            // get SOR paths
            const amountIn = parseUnits('0.1', tIn.decimals);
            const swapKind = SwapKind.GivenIn;
            paths = (await sorGetPathsWithPools(
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
            expect(returnAmountQuery.amount).toBe(returnAmountSOR.amount);
        });
    });

    describe('Swap Given Out', () => {
        beforeAll(async () => {
            // get SOR paths
            const amountOut = parseUnits('0.1', tOut.decimals);
            const swapKind = SwapKind.GivenOut;
            paths = (await sorGetPathsWithPools(
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
            expect(returnAmountQuery.amount).toBe(returnAmountSOR.amount);
        });
    });

    afterAll(async () => {
        await stopAnvilForks();
    });
});
