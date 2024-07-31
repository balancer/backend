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
} from '../../test/factories';

describe('Balancer SOR Integration Tests', () => {
    let rpcUrl: string;
    let paths: PathWithAmount[];
    let sdkSwap: Swap;

    beforeAll(async () => {
        // start fork to run queries against
        const fork = await startFork(ANVIL_NETWORKS.SEPOLIA, undefined, BigInt(6411431));
        rpcUrl = fork.rpcUrl;
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
                protocolVersion: 3,
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
            paths = (await sorGetPathsWithPools(tIn, tOut, SwapKind.GivenIn, amountIn, [
                prismaWeightedPool,
            ])) as PathWithAmount[];

            // build SDK swap from SOR paths
            sdkSwap = new Swap({
                chainId: parseFloat(chainToIdMap['SEPOLIA']),
                paths: paths.map((path) => ({
                    protocolVersion: 3,
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
            expect(returnAmountQuery.scale18).toEqual(returnAmountSOR.scale18);
        });
    });

    describe('Stable Pool Path', () => {
        beforeAll(async () => {
            // setup mock pool data
            const poolAddress = '0x302b75a27e5e157f93c679dd7a25fdfcdbc1473c';
            const USDC = prismaPoolTokenFactory.build({
                address: '0x8a88124522dbbf1e56352ba3de1d9f78c143751e',
                token: { decimals: 6 },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '500',
                }),
            });
            const DAI = prismaPoolTokenFactory.build({
                address: '0xde46e43f46ff74a23a65ebb0580cbe3dfe684a17',
                token: { decimals: 18 },
                dynamicData: prismaPoolTokenDynamicDataFactory.build({
                    balance: '500',
                }),
            });
            const prismaStablePool = prismaPoolFactory.stable('1000').build({
                address: poolAddress,
                tokens: [USDC, DAI],
                dynamicData: prismaPoolDynamicDataFactory.build({
                    totalShares: '1054.451151293881721519',
                    swapFee: '0.01',
                }),
            });

            // get SOR paths
            const tIn = new Token(
                parseFloat(chainToIdMap[USDC.token.chain]),
                USDC.address as Address,
                USDC.token.decimals,
            );
            const tOut = new Token(
                parseFloat(chainToIdMap[DAI.token.chain]),
                DAI.address as Address,
                DAI.token.decimals,
            );
            const amountIn = BigInt(1000e6);
            paths = (await sorGetPathsWithPools(tIn, tOut, SwapKind.GivenIn, amountIn, [
                prismaStablePool,
            ])) as PathWithAmount[];

            const swapPaths: Path[] = paths.map((path) => ({
                protocolVersion: 3,
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
            expect(returnAmountQuery.scale18).toEqual(returnAmountSOR.scale18);
        });
    });

    afterAll(async () => {
        await stopAnvilForks();
    });
});
