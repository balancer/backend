import config from '../../config';
import { chainIdToChain } from '../../modules/network/chain-id-to-chain';
import { generateSwapPathTestData } from './generate/generateSwapPathTestData';
import type { Config } from './types';

async function generateTestData() {
    const configFile = './test/testData/config.json';
    const testConfig = await readConfig(configFile);
    const overWrite = Bun.argv[2] === 'true';
    for (const swapPathTest of testConfig.swapPathTests) {
        const chain = chainIdToChain[swapPathTest.chainId];
        const rpcUrl = config[chain].rpcUrl;
        if (!rpcUrl) throw new Error(`Missing RPC env for chain: ${swapPathTest.chainId}`);
        await generateSwapPathTestData(
            {
                ...swapPathTest,
                rpcUrl,
            },
            overWrite,
        );
    }
}

async function readConfig(path: string) {
    const file = Bun.file(path);
    const contents = await file.json();
    return contents as Config;
}

generateTestData();
