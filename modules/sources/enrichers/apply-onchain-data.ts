import { formatEther, formatUnits } from 'viem';
import { OnchainDataCowAmm, OnchainDataV3 } from '../contracts';
import { Chain } from '@prisma/client';
import { PoolDynamicUpsertData } from '../../../prisma/prisma-types';

export const applyOnchainDataUpdateV3 = (
    onchainPoolData: OnchainDataV3,
    allTokens: { address: string; decimals: number }[],
    chain: Chain,
    poolId: string,
    blockNumber: bigint,
): PoolDynamicUpsertData => {
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));
    return {
        poolDynamicData: {
            id: poolId.toLowerCase(),
            pool: {
                connect: {
                    id_chain: {
                        id: poolId.toLowerCase(),
                        chain: chain,
                    },
                },
            },
            isPaused: onchainPoolData.isPoolPaused,
            isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
            totalShares: formatEther(onchainPoolData.totalSupply),
            totalSharesNum: parseFloat(formatEther(onchainPoolData.totalSupply)),
            blockNumber: Number(blockNumber),
            swapFee: formatEther(onchainPoolData.swapFee ?? 0n),
            aggregateSwapFee: formatEther(onchainPoolData.aggregateSwapFee ?? 0n),
            aggregateYieldFee: formatEther(onchainPoolData.aggregateYieldFee ?? 0n),
            swapEnabled: true,
            totalLiquidity: 0,
        },
        poolTokenDynamicData: onchainPoolData.tokens?.map((tokenData) => ({
            id: `${poolId}-${tokenData.address.toLowerCase()}`,
            poolTokenId: `${poolId}-${tokenData.address.toLowerCase()}`,
            chain: chain,
            balance: formatUnits(tokenData.balance, decimals[tokenData.address.toLowerCase()]),
            priceRate: formatEther(tokenData.rate),
            blockNumber: Number(blockNumber),
            balanceUSD: 0,
        })),
    };
};

export const applyOnchainDataUpdateCowAmm = (
    onchainPoolData: OnchainDataCowAmm,
    allTokens: { address: string; decimals: number }[],
    chain: Chain,
    poolId: string,
    blockNumber: bigint,
): PoolDynamicUpsertData => {
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));

    return {
        poolDynamicData: {
            id: poolId.toLowerCase(),
            pool: {
                connect: {
                    id_chain: {
                        id: poolId.toLowerCase(),
                        chain: chain,
                    },
                },
            },
            totalShares: formatEther(onchainPoolData.totalSupply),
            blockNumber: Number(blockNumber),
            swapFee: formatEther(onchainPoolData.swapFee),
            swapEnabled: true,
            totalLiquidity: 0,
        },
        poolTokenDynamicData: onchainPoolData.tokens.map((tokenData) => ({
            id: `${poolId}-${tokenData.address.toLowerCase()}`,
            poolTokenId: `${poolId}-${tokenData.address.toLowerCase()}`,
            chain: chain,
            balance: formatUnits(tokenData.balance, decimals[tokenData.address.toLowerCase()]),
            blockNumber: Number(blockNumber),
            priceRate: '1',
            balanceUSD: 0,
        })),
    };
};
