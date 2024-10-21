import { Chain, Prisma } from '@prisma/client';
import { OnchainDataCowAmm, OnchainDataV3 } from '../contracts';
import { formatEther, formatUnits } from 'viem';

export type PoolDynamicUpsertData = {
    poolDynamicData: Prisma.PrismaPoolDynamicDataCreateInput;
    poolTokenDynamicData: Prisma.PrismaPoolTokenDynamicDataCreateManyInput[];
};

export const onchainCowAmmPoolUpdate = (
    onchainPoolData: OnchainDataCowAmm,
    allTokens: { address: string; decimals: number }[],
    chain: Chain,
    id: string,
    blockNumber: bigint,
): PoolDynamicUpsertData => {
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));

    return {
        poolDynamicData: {
            id: id.toLowerCase(),
            pool: {
                connect: {
                    id_chain: {
                        id: id.toLowerCase(),
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
            id: `${id}-${tokenData.address.toLowerCase()}`,
            poolTokenId: `${id}-${tokenData.address.toLowerCase()}`,
            chain: chain,
            balance: formatUnits(tokenData.balance, decimals[tokenData.address.toLowerCase()]),
            blockNumber: Number(blockNumber),
            priceRate: '1',
            balanceUSD: 0,
        })),
    };
};

export const onchainV3PoolUpdate = (
    onchainPoolData: OnchainDataV3,
    allTokens: { address: string; decimals: number }[],
    chain: Chain,
    id: string,
    blockNumber: bigint,
): PoolDynamicUpsertData => {
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));
    return {
        poolDynamicData: {
            id: id.toLowerCase(),
            pool: {
                connect: {
                    id_chain: {
                        id: id.toLowerCase(),
                        chain: chain,
                    },
                },
            },
            isPaused: onchainPoolData.isPoolPaused,
            isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
            totalShares: formatEther(onchainPoolData.totalSupply),
            blockNumber: Number(blockNumber),
            swapFee: formatEther(onchainPoolData.swapFee ?? 0n),
            aggregateSwapFee: formatEther(onchainPoolData.aggregateSwapFee ?? 0n),
            aggregateYieldFee: formatEther(onchainPoolData.aggregateYieldFee ?? 0n),
            swapEnabled: true,
            totalLiquidity: 0,
        },
        poolTokenDynamicData: onchainPoolData.tokens?.map((tokenData) => ({
            id: `${id}-${tokenData.address.toLowerCase()}`,
            poolTokenId: `${id}-${tokenData.address.toLowerCase()}`,
            chain: chain,
            balance: formatUnits(tokenData.balance, decimals[tokenData.address.toLowerCase()]),
            priceRate: formatEther(tokenData.rate),
            blockNumber: Number(blockNumber),
            balanceUSD: 0,
        })),
    };
};
