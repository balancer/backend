import { AbiEvent } from 'abitype';
import { ViemClient } from '../types';

export const getChangedAddresses = async (
    addresses: string[],
    events: readonly AbiEvent[],
    client: ViemClient,
    fromBlock: number,
    toBlock: number,
    rpcMaxBlockRange: number,
) => {
    const range = toBlock - fromBlock;
    const batches = Math.ceil(range / rpcMaxBlockRange);

    const changedAddresses = new Set<string>();
    for (let i = 0; i < batches; i++) {
        const from = fromBlock + (i > 0 ? 1 : 0) + i * rpcMaxBlockRange;
        const to = Math.min(fromBlock + (i + 1) * rpcMaxBlockRange, toBlock);
        const logs = await client.getLogs({
            address: addresses as `0x${string}`[],
            events,
            fromBlock: BigInt(from),
            toBlock: BigInt(to),
        });
        logs.forEach((log) => changedAddresses.add(log.address.toLowerCase()));
    }

    return Array.from(changedAddresses);
};
