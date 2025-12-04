import { Chain } from '@prisma/client';
import { getViemClient } from '../sources/viem-client';
import { jsonRpcStream } from './actions/json-rpc-stream';
import {
    V2_SWAP_TOPIC,
    V3_SWAP_TOPIC,
    V2_LIQUIDITY_TOPIC,
    V3_ADD_LIQUIDITY_TOPIC,
    V3_REMOVE_LIQUIDITY_TOPIC,
    eventStreamConfig,
} from './actions/stream-config';

const runStream = async (chain: Chain, fromBlock: bigint) => {
    const totalLogs = {
        swapV2: 0,
        liquidityV2: 0,
        swapV3: 0,
        liquidityV3: 0,
        created: 0,
        unknown: new Map<string, number>(),
    };

    const viemClient = getViemClient(chain);
    const streamConfig = eventStreamConfig(chain);

    for await (const rawLogs of jsonRpcStream(viemClient, fromBlock, streamConfig)) {
        if (rawLogs.length === 0) continue;

        for (const log of rawLogs) {
            switch (log.topics[0]) {
                case V2_SWAP_TOPIC:
                    totalLogs.swapV2 += 1;
                    break;
                case V2_LIQUIDITY_TOPIC:
                    totalLogs.liquidityV2 += 1;
                    break;
                case V3_SWAP_TOPIC:
                    totalLogs.swapV3 += 1;
                    break;
                case V3_ADD_LIQUIDITY_TOPIC:
                case V3_REMOVE_LIQUIDITY_TOPIC:
                    totalLogs.liquidityV3 += 1;
                    break;
                default:
                    const topic = log.topics[0];
                    totalLogs.unknown.set(topic, (totalLogs.unknown.get(topic) || 0) + 1);
                    break;
            }
        }
    }

    return totalLogs;
};

const chainArg = process.argv[2] ? (process.argv[2] as Chain) : 'MAINNET';
const fromBlockArg = process.argv[3] ? BigInt(process.argv[3]) : 23830000n;

runStream(chainArg, fromBlockArg)
    .then(console.log)
    .catch((error) => {
        console.error('[run-pricing] Fatal error:', error);
        process.exit(1);
    });
