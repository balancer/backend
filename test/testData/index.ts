import { generateSwapPathTestData } from './generate/generateSwapPathTestData';
import type { Config } from './types';

const RPC_URL: Record<number, string | undefined> = {
    1: Bun.env.ETHEREUM_RPC_URL,
    11155111: Bun.env.SEPOLIA_RPC_URL,
};

async function generateTestData() {
    const configFile = './test/testData/config.json';
    const config = await readConfig(configFile);
    const overWrite = Bun.argv[2] === 'true';
    for (const swapPathTest of config.swapPathTests) {
        const rpcUrl = RPC_URL[swapPathTest.chainId];
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
