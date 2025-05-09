// bun run vitest sor/sor.integration.test.ts

import { SwapKind, TokenAmount } from '@balancer/sdk';

import { PathWithAmount } from './lib/path';
import { SOR } from './lib/sor';
import { getOutputAmount, getInputAmount } from './lib/utils/helpers';

import { readTestData } from '../../test/testData/read/readTestData';
import { PrismaPoolAndHookWithDynamic } from '../../prisma/prisma-types';
import { getTokensFromPrismaPools } from '../../test/utils';
import { formatUnits } from 'viem';
import { BufferPoolData } from './utils/data';

// This test will run against all files added to test/testData/read
// In order to add new scenarios, please add them to test/testData/config.json

// Note: these tests are only available for Balancer V3
const protocolVersion = 3;

describe('SOR V3 Swap Paths Integration Tests', () => {
    // read all test files in test/testData/read
    const testData = readTestData();
    test.each(testData.swapPaths)('$test $swapKind $amount', async (swapPath) => {
        const { amountRaw, pools, tokens, outputRaw, swapKind, currentTimestamp, chainId } = swapPath;

        const index = testData.swapPaths.indexOf(swapPath);
        const prismaPools: PrismaPoolAndHookWithDynamic[] = testData.swapPathPools[index];
        const bufferPools: BufferPoolData[] = testData.bufferPools[index];
        const { tokenIn, tokenOut } = getTokensFromPrismaPools(Number(chainId), prismaPools, tokens, bufferPools);

        const paths = (await SOR.getPathsWithPools(
            tokenIn,
            tokenOut,
            swapKind,
            amountRaw,
            prismaPools,
            bufferPools,
            protocolVersion,
            {
                currentTimestamp,
            },
        )) as PathWithAmount[];

        // make sure path found is the same as the onde described in the test
        expect(pools.map((pool) => pool.toLowerCase())).toEqual(
            paths[0].pools.map((pool) => pool.address.toLowerCase()),
        );

        const returnAmountQuery = TokenAmount.fromRawAmount(
            swapKind === SwapKind.GivenIn ? tokenOut : tokenIn,
            outputRaw,
        );
        const returnAmountSOR = swapKind === SwapKind.GivenIn ? getOutputAmount(paths) : getInputAmount(paths);

        const isSwapPathWithBufferPools = bufferPools.length > 0;
        if (isSwapPathWithBufferPools) {
            const returnAmountQueryFloat = parseFloat(
                formatUnits(returnAmountQuery.amount, returnAmountQuery.token.decimals),
            );
            const returnAmountSORFloat = parseFloat(
                formatUnits(returnAmountSOR.amount, returnAmountSOR.token.decimals),
            );
            const minDecimals = Math.min(returnAmountQuery.token.decimals, returnAmountSOR.token.decimals);
            expect(returnAmountQueryFloat).toBeCloseTo(returnAmountSORFloat, minDecimals - 2);
        } else {
            expect(returnAmountQuery.amount).toBe(returnAmountSOR.amount);
        }
    });
});
