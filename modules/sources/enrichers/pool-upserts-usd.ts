import _ from 'lodash';
import { Prisma } from '@prisma/client';

export const enrichPoolUpsertsUsd = <T>(
    data: {
        poolToken: {
            id: string;
            balance: string;
        }[];
        poolDynamicData: Prisma.PrismaPoolDynamicDataUpdateInput;
    },
    prices: { [address: string]: number },
) => {
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
    } as T & {
        poolToken: {
            balanceUSD: number;
        }[];
        poolDynamicData: {
            totalLiquidity: number;
        };
    };
};
