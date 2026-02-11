import abi from './abis/fixed-lb-pool';
import vaultV3 from './abis/VaultV3';
import { Chain } from '@prisma/client';
import { getViemClient } from '../viem-client';
import config from '../../../config';
import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype';
import { fetchErc20Headers } from './fetch-erc20-headers';

type ImmutableData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof abi, 'getFixedPriceLBPoolImmutableData'>['outputs']
>[0];

type DynamicData = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof abi, 'getFixedPriceLBPoolDynamicData'>['outputs']
>[0];

const getPoolRoleAccounts = vaultV3.filter((item) => item.type === 'function' && item.name === 'getPoolRoleAccounts');

type PoolRoleAccounts = AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<typeof getPoolRoleAccounts, 'getPoolRoleAccounts'>['outputs']
>[0];

export type FixedLBPoolData = {
    pool: {
        name: string;
        symbol: string;
        swapFeeManager: string;
        poolCreator: string;
        pauseManager: string;
        typeData: {
            startTime: number;
            endTime: number;
            lbpOwner: string;
            isProjectTokenSwapInBlocked: boolean;
            projectToken: string;
            projectTokenIndex: number;
            reserveToken: string;
            reserveTokenIndex: number;
        };
        tokens: {
            address: string;
            index: number;
            balance: string;
        }[];
    };
    dynamicData: {
        swapEnabled: boolean;
        swapFee: string;
        totalShares: string;
        totalSharesNum: number;
        blockNumber: number;
    };
    tokens: {
        address: string;
        name: string;
        symbol: string;
        decimals: number;
    }[];
};

export async function fetchFixedLBPoolData(pool: string, chain: Chain): Promise<FixedLBPoolData> {
    const client = getViemClient(chain);
    const vaultAddress = config[chain].balancer.v3.vaultAddress;
    const blockNumber = await client.getBlockNumber().then(Number);

    let contracts = [
        {
            address: pool as `0x${string}`,
            abi,
            functionName: 'getFixedPriceLBPoolImmutableData',
        },
        {
            address: pool as `0x${string}`,
            abi,
            functionName: 'getFixedPriceLBPoolDynamicData',
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
        {
            address: pool as `0x${string}`,
            abi,
            functionName: 'owner',
        },
        {
            address: vaultAddress as `0x${string}`,
            abi: getPoolRoleAccounts,
            functionName: 'getPoolRoleAccounts',
            args: [pool],
        },
        {
            address: pool as `0x${string}`,
            abi,
            functionName: 'isProjectTokenSwapInBlocked',
        },
    ];

    const results = await client.multicall({ contracts, allowFailure: false });
    const immutableData = results[0] as unknown as ImmutableData;
    const dynamicData = results[1] as unknown as DynamicData;
    const roleAccounts = results[5] as unknown as PoolRoleAccounts;
    const isProjectTokenSwapInBlocked = results[6] as unknown as boolean;

    // Tokens
    const tokenHeaders = await fetchErc20Headers(immutableData.tokens, client).then((headers) =>
        immutableData.tokens.map((address) => headers[address]),
    );

    return {
        pool: {
            name: results[2] as string,
            symbol: results[3] as string,
            swapFeeManager: roleAccounts.swapFeeManager,
            poolCreator: roleAccounts.poolCreator,
            pauseManager: roleAccounts.pauseManager,
            typeData: {
                startTime: Number(immutableData.startTime),
                endTime: Number(immutableData.endTime),
                lbpOwner: (results[4] as string).toLowerCase(),
                isProjectTokenSwapInBlocked: isProjectTokenSwapInBlocked,
                projectToken: immutableData.tokens[Number(immutableData.projectTokenIndex)].toLowerCase(),
                projectTokenIndex: Number(immutableData.projectTokenIndex),
                reserveToken: immutableData.tokens[Number(immutableData.reserveTokenIndex)].toLowerCase(),
                reserveTokenIndex: Number(immutableData.reserveTokenIndex),
            },
            tokens: immutableData.tokens.map((address, i) => ({
                address: address.toLowerCase(),
                index: i,
                balance: String(Number(dynamicData.balancesLiveScaled18[i]) / 10 ** 18),
            })),
        },
        dynamicData: {
            swapEnabled: dynamicData.isSwapEnabled,
            swapFee: String(Number(dynamicData.staticSwapFeePercentage) / 10 ** 18),
            totalShares: String(Number(dynamicData.totalSupply) / 10 ** 18),
            totalSharesNum: Number(dynamicData.totalSupply) / 10 ** 18,
            blockNumber,
        },
        tokens: immutableData.tokens.map((address, i) => ({
            address: address.toLowerCase(),
            ...tokenHeaders[i],
        })),
    };
}
