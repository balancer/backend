import type { SwapPathTestInput, SwapPathTestOutput } from '../types';
import { getSwapPath } from './getSwapPath';
import { getPool } from './getPool';
import { enrichPoolsWithHookData } from './enrichPoolsWithHookData';

export async function generateSwapPathTestData(input: SwapPathTestInput, overwrite = false) {
    const path = `./test/testData/read/${input.chainId}-${input.blockNumber}-${input.testName}.json`;
    if (!overwrite) {
        const file = Bun.file(path);
        if (await file.exists()) {
            console.log('File already exists and overwrite set to false.', path);
            return;
        }
    }
    console.log('Generating test data with input:\n', input);
    const testData = await fetchTestData(input);
    console.log('Saving test data to: ', path);
    await Bun.write(path, JSON.stringify(testData, null, 4));
    console.log('Complete');
}

async function fetchTestData(input: SwapPathTestInput): Promise<SwapPathTestOutput> {
    const { rpcUrl, chainId, blockNumber, swapPathInput } = input;
    const swapPath = await getSwapPath(swapPathInput, rpcUrl, chainId, blockNumber);

    const pools = await Promise.all(
        swapPathInput.pools.map((pool) => getPool(rpcUrl, chainId, blockNumber, pool.poolType, pool.poolAddress)),
    );

    const poolsWithHooks = await enrichPoolsWithHookData(pools, chainId, blockNumber);

    return {
        test: { chainId, blockNumber },
        swapPath,
        pools: poolsWithHooks,
    };
}
