import _ from 'lodash';
import { PoolDynamicUpsertData } from '../../../prisma/prisma-types';

export const enrichPoolUpsertsUsd = <T extends PoolDynamicUpsertData>(
    data: T,
    prices: { [address: string]: number },
): T => {
    const poolToken = data.poolToken.map((token) => ({
        ...token,
        balanceUSD: parseFloat(token.balance) * prices[token.id.split('-')[1]] || 0,
    }));

    const poolDynamicData = {
        ...data.poolDynamicData,
        totalLiquidity: poolToken.reduce((acc, token) => acc + Number(token.balanceUSD), 0),
    };

    return {
        ...data,
        poolDynamicData,
        poolToken,
    };
};
