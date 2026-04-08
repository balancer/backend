import { PrismaToken } from '@prisma/client';
import { Multicaller3Viem } from '../../../web3/multicaller-viem';
import MinimalErc4626Abi from '../abis/MinimalERC4626';
import { formatEther, parseUnits } from 'viem';

/**
 * Fetches convertToAssets rates for a list of ERC4626 tokens and returns them as strings
 * @param erc4626Tokens
 * @returns
 */
export const fetchUnwrapRates = async (
    erc4626Tokens: PrismaToken[],
    underlyingTokenMap: { [address: string]: PrismaToken },
): Promise<{
    [id: string]: { unwrapRate: string };
}> => {
    if (erc4626Tokens.length === 0) {
        return {};
    }
    // Guard against tokens with missing underlying token
    const validTokens: PrismaToken[] = [];
    const missingTokens: PrismaToken[] = [];

    for (const token of erc4626Tokens) {
        const hasUnderlying = token.underlyingTokenAddress && underlyingTokenMap[token.underlyingTokenAddress];

        if (hasUnderlying) {
            validTokens.push(token);
        } else {
            missingTokens.push(token);
        }
    }

    if (missingTokens.length) {
        console.log(
            'Missing underlying token in ERC4626 tokens',
            missingTokens.map(({ address, chain }) => [address, chain]),
        );
    }
    const chain = validTokens[0].chain;
    const caller = new Multicaller3Viem(chain, MinimalErc4626Abi);
    validTokens.forEach((token) =>
        caller.call(token.address, token.address, 'convertToAssets', [
            parseUnits('1', 18 + token.decimals - underlyingTokenMap[token.underlyingTokenAddress!].decimals),
        ]),
    );
    const results = await caller.execute<{ [id: string]: bigint }>();

    // Convert the results to floats
    const formattedResults = Object.fromEntries(
        Object.entries(results).map(([key, value]) => {
            return [key, { unwrapRate: formatEther(value) }];
        }),
    );

    return formattedResults;
};
