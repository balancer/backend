import { parseEther } from 'viem';
import config from '../../../config';
import { chainIdToChain } from '../../../modules/network/chain-id-to-chain';
import { fetchHookData } from '../../../modules/sources/contracts/v3/fetch-hook-data';
import { getViemClient } from '../../../modules/sources/viem-client';
import { HookData } from '../../../prisma/prisma-types';
import { PoolBase } from '../types';

export async function enrichPoolsWithHookData(pools: PoolBase[], chainId: number, blockNumber: bigint) {
    const chain = chainIdToChain[chainId];
    const viemClient = getViemClient(chain);
    const hookTypes = config[chain].hooks;

    // append hook type
    const poolsWithHookType = pools.map((pool) => {
        if (!pool.hook) {
            return pool;
        }
        const type = hookTypes?.[pool.hook.address];
        if (!type) {
            throw new Error(`Hook type not found for address ${pool.hook.address}`);
        }
        return {
            ...pool,
            hook: { ...pool.hook, type } as HookData,
        };
    });

    // filter pools with hook and ensure type safety
    const poolsWithHook = poolsWithHookType.filter((pool): pool is typeof pool & { hook: HookData } => {
        return pool.hook !== undefined;
    });

    // fetch hook data reusing backend fetch logic
    const hookData = await fetchHookData(
        viemClient,
        poolsWithHook.map((pool) => ({ ...pool, id: pool.poolAddress })),
        blockNumber,
    );

    // append hook data to pool
    const poolsWithHookData = poolsWithHookType.map((pool) => {
        if (!pool.hook || !hookData[pool.poolAddress]) {
            return pool;
        }

        // scale hook data values to fixed point 18 decimals
        const dynamicData = Object.fromEntries(
            Object.entries(hookData[pool.poolAddress]).map(([key, value]) => [key, String(parseEther(value))]),
        );

        return {
            ...pool,
            hook: {
                ...pool.hook,
                dynamicData,
            },
        };
    });

    return poolsWithHookData;
}
