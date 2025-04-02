// bun run vitest sor/sor.integration.test.ts

import { isSameAddress, SwapKind, Token } from '@balancer/sdk';
import { Address } from 'viem';

import { PathWithAmount } from './lib/path';
import { SOR } from './lib/sor';
import { getOutputAmount, getInputAmount } from './lib/utils/helpers';

import { GyroEPool, StablePool, SupportedPools, WeightedPool, readTestData } from '../../test/testData/readTestData';
import { chainToChainId as chainToIdMap } from '../network/chain-id-to-chain';
import {
    mapGyroPoolStateToPrismaPool,
    mapStablePoolStateToPrismaPool,
    mapWeightedPoolStateToPrismaPool,
} from '../../test/testData/mapping';

const protocolVersion = 3;
const chainId = parseFloat(chainToIdMap['SEPOLIA']);

describe('SOR V3 Swap Paths Integration Tests', () => {
    // read all test files in test/testData
    const testData = readTestData();
    test.each(testData.swapPaths)('$test $swapKind $amount', async (swapPath) => {
        const { amountRaw, tokens, outputRaw, swapKind } = swapPath;

        const index = testData.swapPaths.indexOf(swapPath);
        const supportedPools: SupportedPools[] = testData.swapPathPools[index]; // TODO: map to prisma pools

        const poolsAndTokens = supportedPools.flatMap((pool) => {
            switch (pool.poolType) {
                case 'WEIGHTED':
                    return mapWeightedPoolStateToPrismaPool(pool as WeightedPool, chainId, protocolVersion);
                case 'STABLE':
                    return mapStablePoolStateToPrismaPool(pool as StablePool, chainId, protocolVersion);
                case 'GYROE':
                    return mapGyroPoolStateToPrismaPool(pool as GyroEPool, chainId, protocolVersion);
                default:
                    throw new Error(`Missing mapping for pool type: ${pool.poolType} - please add to mapping.ts`);
            }
        });

        const poolTokens = poolsAndTokens.flatMap((p) => p.poolTokens);

        const tokenIn = poolTokens.find((t) => isSameAddress(t.address as Address, tokens[0] as Address)) as Token;
        const tokenOut = poolTokens.find((t) =>
            isSameAddress(t.address as Address, tokens[tokens.length - 1] as Address),
        ) as Token;

        const paths = (await SOR.getPathsWithPools(
            tokenIn,
            tokenOut,
            swapKind,
            amountRaw,
            poolsAndTokens.map((p) => p.prismaPool),
            [],
            protocolVersion,
        )) as PathWithAmount[];

        const returnAmountSOR = swapKind === SwapKind.GivenIn ? getOutputAmount(paths) : getInputAmount(paths);
        expect(outputRaw).toBe(returnAmountSOR.amount);
    });
});
