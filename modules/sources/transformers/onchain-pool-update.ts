import { Chain } from '@prisma/client';
import { OnchainPoolData } from '../contracts';
import { formatEther, formatUnits } from 'viem';

export type OnchainPoolUpdateData = ReturnType<typeof onchainPoolUpdate>;

export const onchainPoolUpdate = (
    onchainPoolData: OnchainPoolData,
    allTokens: { address: string; decimals: number }[],
    chain: Chain,
    id: string,
    blockNumber: bigint,
) => {
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));
    return {
        poolDynamicData: {
            poolId: id.toLowerCase(),
            chain: chain,
            isPaused: onchainPoolData.isPoolPaused,
            isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
            totalShares: formatEther(onchainPoolData.totalSupply),
            blockNumber: Number(blockNumber),
            swapFee: formatEther(onchainPoolData.swapFee ?? 0n),
            aggregateSwapFee: formatEther(onchainPoolData.aggregateSwapFee ?? 0n),
            aggregateYieldFee: formatEther(onchainPoolData.aggregateYieldFee ?? 0n),
        },
        poolTokenDynamicData:
            onchainPoolData.tokens?.map((tokenData) => ({
                id: `${id}-${tokenData.address.toLowerCase()}`,
                chain: chain,
                balance: formatUnits(tokenData.balance, decimals[tokenData.address.toLowerCase()]),
                priceRate: formatEther(tokenData.rate),
                blockNumber: Number(blockNumber),
            })) || [],
    };
};
