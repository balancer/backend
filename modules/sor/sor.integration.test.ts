// bun run vitest sor/sor.integration.test.ts

import { SwapKind } from '@balancer/sdk';

import { PathWithAmount } from './lib/path';
import { SOR } from './lib/sor';
import { getOutputAmount, getInputAmount } from './lib/utils/helpers';

import { readTestData } from '../../test/testData/read/readTestData';
import { PrismaPoolAndHookWithDynamic } from '../../prisma/prisma-types';
import { areBigIntsWithinPercent, getTokensFromPrismaPools } from '../../test/utils';

// This test will run against all files added to test/testData/read
// In order to add new scenarios, please add them to test/testData/config.json

// Note: these tests are only available for Balancer V3
const protocolVersion = 3;

describe('SOR V3 Swap Paths Integration Tests', () => {
    // read all test files in test/testData/read
    const testData = readTestData();
    test.each(testData.swapPaths)('$test $swapKind $amount', async (swapPath) => {
        const { amountRaw, tokens, outputRaw, swapKind } = swapPath;

        const index = testData.swapPaths.indexOf(swapPath);
        const prismaPools: PrismaPoolAndHookWithDynamic[] = testData.swapPathPools[index];
        const underlyingTokens = testData.underlyingTokens[index];
        const { tokenIn, tokenOut } = getTokensFromPrismaPools(prismaPools, tokens, underlyingTokens);

        const paths = (await SOR.getPathsWithPools(
            tokenIn,
            tokenOut,
            swapKind,
            amountRaw,
            prismaPools,
            underlyingTokens,
            protocolVersion,
        )) as PathWithAmount[];

        const returnAmountSOR = swapKind === SwapKind.GivenIn ? getOutputAmount(paths) : getInputAmount(paths);

        const isSwapPathWithBufferPools = underlyingTokens.length > 0;
        if (isSwapPathWithBufferPools) {
            const isWithinPercent = areBigIntsWithinPercent(outputRaw, returnAmountSOR.amount, 0.0001);
            expect(isWithinPercent).toBe(true);
        } else {
            expect(outputRaw).toBe(returnAmountSOR.amount);
        }
    });
});
