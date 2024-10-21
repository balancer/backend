import { formatUnits } from 'viem';
import type { PoolUpsertData } from '../../../prisma/prisma-types';
import { OnchainDataCowAmm } from '../contracts';

export const applyOnchainDataCowAmm = (upsert: PoolUpsertData, data: OnchainDataCowAmm): PoolUpsertData => ({
    ...upsert,
    poolDynamicData: {
        ...upsert.poolDynamicData,
        totalShares: formatUnits(data.totalSupply, 18),
        swapFee: formatUnits(data.swapFee, 18),
    },
    poolTokenDynamicData: upsert.poolTokenDynamicData.map((tokenData) => {
        const token = data.tokens.find((t) => `${upsert.pool.id}-${t.address}`.toLowerCase() === tokenData.id);
        const tokenDecimals = upsert.tokens.find((t) => t.address === tokenData.id.split('-')[1])?.decimals || 18;
        const balance = formatUnits(token?.balance || 0n, tokenDecimals);

        return {
            ...tokenData,
            balance,
            balanceNum: Number(balance),
        };
    }),
});
