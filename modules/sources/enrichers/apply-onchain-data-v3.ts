import { formatEther, formatUnits } from 'viem';
import type { PoolUpsertData } from '../../../prisma/prisma-types';
import { OnchainDataV3 } from '../contracts';

export const applyOnChainDataV3 = (upsert: PoolUpsertData, onchainPoolData: OnchainDataV3): PoolUpsertData => ({
    ...upsert,
    poolDynamicData: {
        ...upsert.poolDynamicData,
        isPaused: onchainPoolData.isPoolPaused,
        isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
        totalShares: formatEther(onchainPoolData.totalSupply),
        swapFee: formatEther(onchainPoolData.swapFee ?? 0n),
        aggregateSwapFee: formatEther(onchainPoolData.aggregateSwapFee ?? 0n),
        aggregateYieldFee: formatEther(onchainPoolData.aggregateYieldFee ?? 0n),
        swapEnabled: !onchainPoolData.isPoolPaused, // TODO needs to change LBPs
        totalLiquidity: 0,
    },
    poolTokenDynamicData: onchainPoolData.tokens?.map((tokenData) => {
        const tokenDecimals = upsert.tokens.find((t) => t.address === tokenData.address)?.decimals || 18;
        return {
            id: `${upsert.pool.id}-${tokenData.address.toLowerCase()}`,
            poolTokenId: `${upsert.pool.id}-${tokenData.address.toLowerCase()}`,
            chain: upsert.pool.chain,
            balance: formatUnits(tokenData.balance, tokenDecimals),
            balanceNum: Number(formatUnits(tokenData.balance, tokenDecimals)),
            priceRate: formatEther(tokenData.rate),
            blockNumber: upsert.poolDynamicData.blockNumber,
            balanceUSD: 0,
        };
    }),
});
