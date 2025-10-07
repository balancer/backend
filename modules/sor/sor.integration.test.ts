// bun run vitest sor/sor.integration.test.ts

import { SwapKind, TokenAmount } from '@balancer/sdk';

import { PathWithAmount } from './lib/path';
import { SOR } from './lib/sor';
import { getOutputAmount, getInputAmount } from './lib/utils/helpers';

import { readTestData } from '../../test/testData/read/readTestData';
import { PrismaPoolAndHookWithDynamic } from '../../prisma/prisma-types';
import { getTokensFromPrismaPools } from '../../test/utils';
import { formatUnits } from 'viem';
import { BufferPoolData, getTokenPricesMap } from './utils/data';
import { chainIdToChain } from '../network/chain-id-to-chain';

// This test will run against all files added to test/testData/read
// In order to add new scenarios, please add them to test/testData/config.json

// Note: these tests are only available for Balancer V3
const protocolVersion = 3;
const DEBUG = false;

describe('SOR V3 Swap Paths Integration Tests', () => {
    // read all test files in test/testData/read
    const testData = readTestData(DEBUG);
    test.each(testData.swapPaths)('$test $swapKind $amount', async (swapPath) => {
        const { paths: queryPaths, swapKind, currentTimestamp, chainId } = swapPath;

        const index = testData.swapPaths.indexOf(swapPath);
        const prismaPools: PrismaPoolAndHookWithDynamic[] = testData.swapPathPools[index];
        const bufferPools: BufferPoolData[] = testData.bufferPools[index];
        const { tokenIn, tokenOut } = getTokensFromPrismaPools(
            Number(chainId),
            prismaPools,
            queryPaths[0].tokens,
            bufferPools,
        );

        const amountRawSum = queryPaths.reduce((acc, path) => acc + path.amountRaw, 0n);

        const tokenPrices = await getTokenPricesMap(chainIdToChain[Number(chainId)]);

        const sorPaths = (await SOR.getPathsWithPools(
            tokenIn,
            tokenOut,
            swapKind,
            amountRawSum,
            prismaPools,
            bufferPools,
            protocolVersion,
            tokenPrices,
            {
                currentTimestamp,
            },
        )) as PathWithAmount[];

        // make sure path found is the same as the onde described in the test
        expect(sorPaths.map((path) => path.pools.map((pool) => pool.address.toLowerCase()))).toEqual(
            queryPaths.map((path) => path.pools.map((pool) => pool.poolAddress.toLowerCase())),
        );

        const calculatedAmountRawSum = queryPaths.reduce((acc, path) => acc + path.calculatedAmountRaw, 0n);

        const calculatedAmountQuery = TokenAmount.fromRawAmount(
            swapKind === SwapKind.GivenIn ? tokenOut : tokenIn,
            calculatedAmountRawSum,
        );
        const calculatedAmountSOR =
            swapKind === SwapKind.GivenIn ? getOutputAmount(sorPaths) : getInputAmount(sorPaths);

        const isSwapPathWithBufferPools = bufferPools.length > 0;
        if (isSwapPathWithBufferPools) {
            const calculatedAmountQueryFloat = parseFloat(
                formatUnits(calculatedAmountQuery.amount, calculatedAmountQuery.token.decimals),
            );
            const calculatedAmountSORFloat = parseFloat(
                formatUnits(calculatedAmountSOR.amount, calculatedAmountSOR.token.decimals),
            );
            const ratio = calculatedAmountQueryFloat / calculatedAmountSORFloat;
            expect(ratio).toBeCloseTo(1, 3); // 5 bp tolerance
        } else {
            expect(calculatedAmountQuery.amount).toBe(calculatedAmountSOR.amount);
        }
    });
});
