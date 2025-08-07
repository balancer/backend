import { PrismaToken } from '@prisma/client';
import { ViemClient } from '../../types';
import { ViemMulticallCall, multicallViem } from '../../../web3/multicaller-viem';
import { formatUnits } from 'viem';
import abi from '../abis/VaultExplorer';

/**
 * Fetches buffer balances for ERC4626 tokens from VaultExplorer contract
 * Returns both underlying and wrapped token balances from the buffer
 */
export const fetchBufferBalances = async (
    erc4626Tokens: PrismaToken[],
    underlyingTokenMap: { [address: string]: PrismaToken },
    vaultExplorerAddress: string,
    client: ViemClient,
): Promise<{
    [tokenAddress: string]: {
        bufferBalanceUnderlying: string;
        bufferBalanceWrapped: string;
    };
}> => {
    if (erc4626Tokens.length === 0) {
        return {};
    }

    // Filter tokens that are buffer allowed and have underlying token data
    const bufferAllowedTokens = erc4626Tokens.filter(
        (token) =>
            token.isBufferAllowed && token.underlyingTokenAddress && underlyingTokenMap[token.underlyingTokenAddress],
    );

    if (bufferAllowedTokens.length === 0) {
        return {};
    }

    // Prepare multicall calls
    const multicallCalls: ViemMulticallCall[] = bufferAllowedTokens.map((token) => ({
        address: vaultExplorerAddress as `0x${string}`,
        abi,
        functionName: 'getBufferBalance',
        args: [token.address],
        path: `${token.address}`,
    }));

    const results = (await multicallViem(client, multicallCalls)) as { [id: string]: [bigint, bigint] };

    // Convert the results to formatted strings using correct decimals
    const formattedResults: {
        [tokenAddress: string]: { bufferBalanceUnderlying: string; bufferBalanceWrapped: string };
    } = {};

    bufferAllowedTokens.forEach((token, index) => {
        const result = results[token.address];
        if (!result) return;

        const [underlyingBalance, wrappedBalance] = result;
        const underlyingToken = underlyingTokenMap[token.underlyingTokenAddress!];

        // Format balances using correct decimals:
        // - underlying balance uses underlying token decimals
        // - wrapped balance uses wrapped token decimals
        formattedResults[token.address] = {
            bufferBalanceUnderlying: formatUnits(underlyingBalance, underlyingToken.decimals),
            bufferBalanceWrapped: formatUnits(wrappedBalance, token.decimals),
        };
    });

    return formattedResults;
};
