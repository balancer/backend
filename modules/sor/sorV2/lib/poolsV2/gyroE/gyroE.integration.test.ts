// yarn vitest gyroE.integration.test.ts

import { ExactInQueryOutput, Swap, SwapKind, Token, Address, ExactOutQueryOutput, ChainId } from '@balancer/sdk';
import { createTestClient, formatUnits, Hex, http, parseUnits, TestClient } from 'viem';
import { sonic } from 'viem/chains';

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

/**
 * Test Data:
 *
 * In order to properly compare SOR quotes vs SDK queries, we need to setup test data from a specific blockNumber.
 * Although the API does not provide that functionality, we can use subgraph to achieve it.
 * These tests run against the 12th testnet deployment and these are their respective subgraphs:
 * - data common to all pools: [balancer subgraph](https://api.studio.thegraph.com/query/75376/balancer-v3-sepolia/version/latest/graphql)
 *   - tokens (address, balance, decimals)
 *   - totalShares
 *   - swapFee
 * - data specific to each pool type: [pools subgraph](https://api.studio.thegraph.com/query/75376/balancer-pools-v3-sepolia/version/latest/graphql)
 *   - weight
 *   - amp
 * The only item missing from subgraph is priceRate, which can be fetched from a Tenderly simulation (getPoolTokenRates)
 * against the VaultExplorer contract (0xEB15EBBF9C1a4D7D243d57dE447Df0b97C40c324).
 *
 * TODO: improve test data setup by creating a script that fetches all necessary data automatically for a given blockNumber.
 */

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

    beforeAll(async () => {
        // start fork to run queries against
        chainId = parseFloat(chainToIdMap['SONIC']);
        ({ rpcUrl } = await startFork(ANVIL_NETWORKS[ChainId[chainId]]));
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

    beforeEach(async () => {
        await client.revert({
            id: snapshot,
        });
        snapshot = await client.snapshot();
    });

    describe('Swap Given In', () => {
        beforeAll(async () => {
            // get SOR paths
            const amountIn = parseUnits('100', tIn.decimals);
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
            const returnAmountQueryFloat = parseFloat(formatUnits(returnAmountQuery.amount, tIn.decimals));
            const returnAmountSORFloat = parseFloat(formatUnits(returnAmountSOR.amount, tIn.decimals));
            expect(returnAmountQueryFloat).toBeCloseTo(returnAmountSORFloat, tIn.decimals - 2);
        });
    });

    afterAll(async () => {
        await stopAnvilForks();
    });
});
