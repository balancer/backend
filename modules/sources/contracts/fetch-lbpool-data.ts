import abi from './abis/LBPool';
import { Chain } from '@prisma/client';
import { getViemClient } from '../viem-client';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { fetchErc20Headers } from './fetch-erc20-headers';

type ImmutableData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof abi, 'getLBPoolImmutableData'>['outputs']
>[0];

type DynamicData = AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof abi, 'getLBPoolDynamicData'>['outputs']>[0];

export async function fetchLBPoolData(pool: string, chain: Chain) {
    const client = getViemClient(chain);
    const blockNumber = await client.getBlockNumber().then(Number);

    let contracts = [
        {
            address: pool as `0x${string}`,
            abi,
            functionName: 'getLBPoolImmutableData',
        },
        {
            address: pool as `0x${string}`,
            abi,
            functionName: 'getLBPoolDynamicData',
        },
        {
            address: pool as `0x${string}`,
            abi,
            functionName: 'name',
        },
        {
            address: pool as `0x${string}`,
            abi,
            functionName: 'symbol',
        },
    ];

    const results = await client.multicall({ contracts, allowFailure: false });
    const immutableData = results[0] as unknown as ImmutableData;
    const dynamicData = results[1] as unknown as DynamicData;

    // Tokens
    const tokenHeaders = await fetchErc20Headers(immutableData.tokens, client).then((headers) =>
        immutableData.tokens.map((address) => headers[address]),
    );

    return {
        pool: {
            name: results[2] as string,
            symbol: results[3] as string,
            swapFeePercentage: Number(dynamicData.staticSwapFeePercentage) / 10 ** 18,
            typeData: {
                startTime: Number(immutableData.startTime),
                endTime: Number(immutableData.endTime),
                startWeights: immutableData.startWeights.map((x) => Number(x) / 10 ** 18),
                endWeights: immutableData.endWeights.map((x) => Number(x) / 10 ** 18),
            },
            tokens: immutableData.tokens.map((address, i) => ({
                address,
                index: i,
                balance: String(Number(dynamicData.balancesLiveScaled18[i]) / 10 ** 18),
                weight: String(Number(dynamicData.normalizedWeights[i]) / 10 ** 18),
            })),
        },
        dynamicData: {
            swapEnabled: dynamicData.isSwapEnabled,
            swapFee: String(Number(dynamicData.staticSwapFeePercentage) / 10 ** 18),
            totalShares: String(Number(dynamicData.totalSupply) / 10 ** 18),
            blockNumber,
        },
        tokens: immutableData.tokens.map((address, i) => ({
            address,
            ...tokenHeaders[i],
        })),
    };
}
