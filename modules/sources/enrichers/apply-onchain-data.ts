import { formatEther, formatUnits } from 'viem';
import { OnchainDataCowAmm } from '../contracts';
import { Chain } from '@prisma/client';
import { PoolDynamicUpsertData, PoolUpsertData } from '../../../prisma/prisma-types';

export const applyOnchainDataUpdateCowAmm = (
    data: Partial<PoolUpsertData> = {},
    onchainPoolData: OnchainDataCowAmm,
    allTokens: { address: string; decimals: number }[],
    chain: Chain,
    poolId: string,
    blockNumber: number,
): PoolDynamicUpsertData => {
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));

    return {
        poolDynamicData: {
            id: poolId.toLowerCase(),
            totalShares: formatEther(onchainPoolData.totalSupply),
            totalSharesNum: parseFloat(formatEther(onchainPoolData.totalSupply)),
            blockNumber,
            swapFee: formatEther(onchainPoolData.swapFee),
            swapEnabled: true,
            totalLiquidity: 0,
        },
        poolToken:
            data.poolToken?.map((token) => {
                const tokenData = onchainPoolData.tokens?.find(
                    (t) => t.address.toLowerCase() === token.address.toLowerCase(),
                );

                if (!tokenData) {
                    return token;
                }

                return {
                    ...token,
                    balance: formatUnits(tokenData.balance ?? 0n, decimals[tokenData.address.toLocaleLowerCase()]),
                    priceRate: '1',
                    balanceUSD: 0,
                };
            }) ||
            onchainPoolData.tokens?.map((tokenData, index) => ({
                id: `${poolId}-${tokenData.address.toLowerCase()}`,
                chain: chain,
                poolId,
                address: tokenData.address.toLowerCase(),
                index,
                balance: formatUnits(tokenData.balance, decimals[tokenData.address.toLowerCase()]),
                priceRate: '1',
                balanceUSD: 0,
            })),
    };
};
