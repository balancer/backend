import { ANVIL_NETWORKS, startFork } from '../../test/anvil/anvil-global-setup';
import { prismaPoolTokenDynamicDataFactory, prismaPoolTokenFactory } from '../../test/factories/prismaToken.factory';
import { prismaPoolDynamicDataFactory, prismaPoolFactory } from '../../test/factories/prismaPool.factory';
import { sorGetSwapsWithPools as sorGetPathsWithPools } from './sorV2/lib/static';
import { getToken } from './utils';
import { Address } from 'viem';
import { ExactInQueryOutput, MathSol, Swap, SwapKind } from '@balancer/sdk';
import { PathWithAmount } from './sorV2/lib/path';
import { getOutputAmount } from './sorV2/lib/utils/helpers';
import { chainToIdMap } from '../network/network-config';

describe('Balancer SOR Integration tests', () => {
    let rpcUrl: string;
    let paths: PathWithAmount[];
    let sdkSwap: Swap;
    const DAI = '0xb77eb1a70a96fdaaeb31db1b42f2b8b5846b2613';
    const USDC = '0x80d6d3946ed8a1da4e226aa21ccddc32bd127d1a';
    const DAIBalance = '532.5153374233128838';
    const dai = prismaPoolTokenFactory.build({
        address: DAI,
        dynamicData: prismaPoolTokenDynamicDataFactory.build({ balance: DAIBalance }),
    });
    const USDCBalance = '3595.070423';
    const usdc = prismaPoolTokenFactory.build({
        address: USDC,
        dynamicData: prismaPoolTokenDynamicDataFactory.build({ balance: USDCBalance }),
    });

    const prismaWeightedPool = prismaPoolFactory.build({
        type: 'WEIGHTED',
        vaultVersion: 3,
        tokens: [dai, usdc],
        dynamicData: prismaPoolDynamicDataFactory.build({ totalShares: '3600.031785617711288292' }),
    });
    const poolsFromDb = [prismaWeightedPool];
    const config = {
        graphTraversalConfig: {
            maxNonBoostedPathDepth: 4,
        },
    };
    beforeAll(async () => {
        const tIn = await getToken(DAI as Address, 'SEPOLIA');
        const tOut = await getToken(USDC as Address, 'SEPOLIA');
        const fork = await startFork(ANVIL_NETWORKS.SEPOLIA, undefined, BigInt(5555075));
        paths = await sorGetPathsWithPools(tIn, tOut, SwapKind.GivenIn, BigInt(1e18), poolsFromDb, 3, config);
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
        rpcUrl = fork.rpcUrl;
    });
    test('Comparing SOR result with SDK Query', async () => {
        const returnAmountSOR = getOutputAmount(paths);
        const queryOutput = await sdkSwap.query(rpcUrl);
        const returnAmountQuery = (queryOutput as ExactInQueryOutput).expectedAmountOut;
        expect(MathSol.divDownFixed(returnAmountQuery.scale18, returnAmountSOR.scale18)).toBeLessThanOrEqual(1.01e18);
        expect(MathSol.divDownFixed(returnAmountQuery.scale18, returnAmountSOR.scale18)).toBeGreaterThanOrEqual(
            0.99e18,
        );
    });
});
