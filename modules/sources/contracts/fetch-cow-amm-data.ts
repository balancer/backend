import { parseAbi } from 'abitype';
import { ViemClient } from '../types';
import { multicallViem } from '../../web3/multicaller-viem';

const cowAmmAbi = parseAbi([
    'function getSwapFee() view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function getBalance(address) view returns (uint256)',
    'function getFinalTokens() view returns (address[])',
]);

export interface OnchainDataCowAmm {
    totalSupply: bigint;
    swapFee: bigint;
    tokens: {
        address: string;
        balance: bigint;
    }[];
    blockNumber: bigint;
}

export async function fetchCowAmmData(
    pools: string[],
    client: ViemClient,
    blockNumber: bigint,
): Promise<{ [address: string]: OnchainDataCowAmm }> {
    const contracts = pools
        .map((pool) => [
            {
                path: `${pool}.swapFee`,
                address: pool as `0x${string}`,
                abi: cowAmmAbi,
                functionName: 'getSwapFee',
            },
            {
                path: `${pool}.totalSupply`,
                address: pool as `0x${string}`,
                abi: cowAmmAbi,
                functionName: 'totalSupply',
            },
            {
                path: `${pool}.tokenAddresses`,
                address: pool as `0x${string}`,
                abi: cowAmmAbi,
                functionName: 'getFinalTokens',
            },
        ])
        .flat();

    const results = (await multicallViem(client, contracts, blockNumber)) as Record<
        string,
        { swapFee: string; totalSupply: string; tokenAddresses: string[] }
    >;

    // Second call to get the token balances
    const balances = Object.keys(results)
        .map((pool) => {
            const { tokenAddresses } = results[pool];
            if (!tokenAddresses) return [];

            return tokenAddresses.map((token) => ({
                path: `${pool}.tokenBalances.${token}`,
                address: pool as `0x${string}`,
                abi: cowAmmAbi,
                functionName: 'getBalance',
                args: [token],
            }));
        })
        .flat();

    // Get balances
    const balanceResults = (await multicallViem(client, balances, blockNumber)) as Record<
        string,
        {
            tokenBalances: { [token: string]: string };
        }
    >;

    // Merge the results
    const merged = Object.keys(results).map((pool) => {
        const poolResults = results[pool];
        const tokenBalances = balanceResults[pool]?.tokenBalances;
        const tokens =
            poolResults['tokenAddresses']?.map((token) => ({
                address: token.toLowerCase(),
                balance: BigInt(tokenBalances[token]),
            })) ?? [];
        return {
            [pool]: {
                swapFee: BigInt(poolResults['swapFee']),
                totalSupply: BigInt(poolResults['totalSupply']),
                tokens,
                blockNumber,
            },
        };
    });

    return Object.assign({}, ...merged);
}
