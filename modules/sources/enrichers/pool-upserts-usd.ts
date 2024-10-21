import _ from 'lodash';
import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { PoolDynamicUpsertData } from './apply-onchain-pool-update';

export const enrichPoolUpsertsUsd = (
    data: PoolDynamicUpsertData,
    prices: { [address: string]: number },
): PoolDynamicUpsertData => {
    const poolTokenDynamicData = data.poolTokenDynamicData.map((token) => ({
        ...token,
        balanceUSD: parseFloat(token.balance) * prices[token.id.split('-')[1]] || 0,
    }));

    const poolDynamicData = {
        ...data.poolDynamicData,
        totalLiquidity: poolTokenDynamicData.reduce((acc, token) => acc + Number(token.balanceUSD), 0),
    };

    return {
        ...data,
        poolDynamicData,
        poolTokenDynamicData,
    };
};
