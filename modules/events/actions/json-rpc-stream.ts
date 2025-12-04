import { Hex, Block, numberToHex, hexToBigInt, RpcLog } from 'viem';
import { ViemClient } from '../../sources/viem-client';
import type { StreamConfig } from './stream-config';

// Transform viem log into normalized structure
const normalizeLog = (log: RpcLog, block: Block, transactionFrom: string, logsBloom?: Hex) => ({
    address: log.address.toLowerCase(),
    topics: log.topics as any[],
    data: log.data,
    blockNumber: Number(log.blockNumber),
    logIndex: Number(log.logIndex),
    transactionHash: log.transactionHash!,
    timestamp: Number(block.timestamp),
    transactionFrom: transactionFrom.toLowerCase(),
    logsBloom,
});

export type StreamLog = ReturnType<typeof normalizeLog>;

// Convert stream config to getLogs filter parameters
const configToFilters = (config: readonly { address?: readonly string[]; topics?: readonly (readonly Hex[])[] }[]) => {
    return config.map((logConfig) => ({
        address: (logConfig.address as Hex[] | undefined) || undefined,
        topics: (logConfig.topics as unknown as (Hex | Hex[] | null)[] | undefined) || undefined,
    }));
};

// JSON RPC getLogs-based stream implementation
export const jsonRpcStream = async function* (
    client: ViemClient,
    fromBlock: bigint,
    config: StreamConfig,
    batchSize: number = 1000, // Block range per batch
) {
    const filters = configToFilters(config);

    let currentBlock = Number(fromBlock);
    const latestBlock = await client.getBlockNumber();

    console.log(
        `[jsonrpc-stream] Starting stream: fromBlock=${fromBlock}, latestBlock=${latestBlock}, batchSize=${batchSize}`,
    );

    while (currentBlock <= latestBlock) {
        const toBlock = Math.min(currentBlock + batchSize - 1, Number(latestBlock));

        console.log(`[jsonrpc-stream] Fetching logs for blocks ${currentBlock} to ${toBlock}`);

        // Fetch logs for all filter configurations in parallel
        const logsArrays = await Promise.all(
            filters.map((filter) =>
                client.request({
                    method: 'eth_getLogs',
                    params: [
                        {
                            fromBlock: numberToHex(currentBlock),
                            toBlock: numberToHex(toBlock),
                            ...filter,
                        },
                    ],
                }),
            ),
        );

        // Combine all logs from different filters
        const allLogs = logsArrays.flat();

        if (allLogs.length > 0) {
            // Fetch unique blocks and transactions
            const uniqueBlockNumbers = Array.from(
                new Set(allLogs.map((log) => log.blockNumber).filter((n): n is Hex => n !== null)),
            );
            const uniqueTxHashes = Array.from(
                new Set(allLogs.map((log) => log.transactionHash).filter((h): h is Hex => h !== null)),
            );

            const [blocks, transactions] = await Promise.all([
                Promise.all(uniqueBlockNumbers.map((num) => client.getBlock({ blockNumber: hexToBigInt(num) }))),
                Promise.all(
                    uniqueTxHashes.map((hash) =>
                        client.getTransactionReceipt({ hash }).then((receipt) => ({
                            from: receipt.from,
                            hash: receipt.transactionHash,
                            logsBloom: receipt.logsBloom,
                        })),
                    ),
                ),
            ]);

            const blockMap = new Map(blocks.map((block) => [block.number, block]));
            const txMap = new Map(transactions.map((tx) => [tx.hash, tx]));

            // Normalize and sort logs
            const rawLogs = allLogs
                .map((log) => {
                    const block = blockMap.get(hexToBigInt(log.blockNumber!));
                    const tx = txMap.get(log.transactionHash!);
                    if (!block || !tx) return null;

                    return normalizeLog(log, block as Block, tx.from, tx.logsBloom);
                })
                .filter((log): log is NonNullable<typeof log> => log !== null)
                .sort((a, b) => {
                    // Sort by block number, then log index to ensure chronological order
                    if (a.blockNumber !== b.blockNumber) {
                        return a.blockNumber - b.blockNumber;
                    }
                    return a.logIndex - b.logIndex;
                });

            yield rawLogs;
        }

        currentBlock = toBlock + 1;

        // Stop if we've reached the latest block
        if (currentBlock > latestBlock) {
            break;
        }
    }

    console.log(`[jsonrpc-stream] Stream complete`);
};
