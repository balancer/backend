// yarn vitest balancer-sor.integration.test.ts

import { ExactInQueryOutput, Swap, SwapKind, Token, Address } from '@balancer/sdk';

import { PathWithAmount } from './sorV2/lib/path';
import { sorGetPathsWithPools } from './sorV2/lib/static';
import { getOutputAmount } from './sorV2/lib/utils/helpers';
import { chainToIdMap } from '../network/network-config';

import { ANVIL_NETWORKS, startFork, stopAnvilForks } from '../../test/anvil/anvil-global-setup';
import { prismaPoolTokenDynamicDataFactory, prismaPoolTokenFactory } from '../../test/factories/prismaToken.factory';
import { prismaPoolDynamicDataFactory, prismaPoolFactory } from '../../test/factories/prismaPool.factory';

describe('Balancer SOR Integration Tests', () => {
    let rpcUrl: string;
    let paths: PathWithAmount[];
    let sdkSwap: Swap;
    beforeAll(async () => {
        // setup mock pool data
        const poolAddress = '0xb0948D31C1a2C338C68402cd58CA7f2962aa14A9';
        const WETH = '0x7b79995e5f793a07bc00c21412e50ecae098e7f9';
        const BAL = '0xb19382073c7a0addbb56ac6af1808fa49e377b75';
        const prismaWeightedPool = prismaPoolFactory.build({
            address: poolAddress,
            type: 'WEIGHTED',
            vaultVersion: 3,
            tokens: [
                prismaPoolTokenFactory.build({
                    address: WETH,
                    dynamicData: prismaPoolTokenDynamicDataFactory.build({
                        balance: '0.009997501561329177',
                        weight: '0.8',
                    }),
                }),
                prismaPoolTokenFactory.build({
                    address: BAL,
                    dynamicData: prismaPoolTokenDynamicDataFactory.build({
                        balance: '10.010000000000000000',
                        weight: '0.2',
                    }),
                }),
            ],
            dynamicData: prismaPoolDynamicDataFactory.build({ totalShares: '0.039810717055348925', swapFee: '0' }),
        });

        // get SOR paths
        const tIn = new Token(parseFloat(chainToIdMap['SEPOLIA']), BAL as Address, 18);
        const tOut = new Token(parseFloat(chainToIdMap['SEPOLIA']), WETH as Address, 18);
        const amountIn = BigInt(0.1e18);
        const sorConfig = {
            graphTraversalConfig: {
                maxNonBoostedPathDepth: 4,
            },
        };
        paths = (await sorGetPathsWithPools(
            tIn,
            tOut,
            SwapKind.GivenIn,
            amountIn,
            [prismaWeightedPool],
            sorConfig,
        )) as PathWithAmount[];

        // build SDK swap from SOR paths
        sdkSwap = new Swap({
            chainId: parseFloat(chainToIdMap['SEPOLIA']),
            paths: paths.map((path) => ({
                vaultVersion: 3,
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

        // start fork to run query against
        const fork = await startFork(ANVIL_NETWORKS.SEPOLIA, undefined, BigInt(5949195));
        rpcUrl = fork.rpcUrl;
    });

    test('SOR quote should match swap query', async () => {
        const returnAmountSOR = getOutputAmount(paths);
        const queryOutput = await sdkSwap.query(rpcUrl);
        const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
        expect(returnAmountQuery.scale18).toEqual(returnAmountSOR.scale18);
    });

    afterAll(async () => {
        await stopAnvilForks();
    });
});
