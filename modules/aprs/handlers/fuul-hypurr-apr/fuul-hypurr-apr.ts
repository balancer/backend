import { PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { AprHandler, PoolAPRData } from '../../types';
import { chainIdToChain } from '../../../network/chain-id-to-chain';
import { env } from '../../../../apps/env';

const baseURL = 'https://api.fuul.xyz/api/v1/conversions';

export class FuulHypurrAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'FuulHypurrAprHandler';
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const apiResponse = await fetch(baseURL, {
            method: 'GET',
            headers: { Authorization: `Bearer ${env.FUUL_HYPURR_API_KEY}`, 'Content-Type': 'application/json' },
        });

        const data = (await apiResponse.json()) as {
            id: string;
            name: string;
            enabled: boolean;
            triggers: { context: { token_address: string; chain_id: number } }[];
            metrics: { apr: string };
        }[];

        const aprMap: Map<string, Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>> = new Map();

        // we need to map the response to our internal format and sum aprs for the same pool (in case there are multiple triggers for the same pool)
        for (const item of data) {
            if (item.enabled && item.triggers.length > 0 && parseFloat(item.metrics.apr) > 0) {
                const chain = chainIdToChain[`${item.triggers[0].context.chain_id}`];
                const poolId = item.triggers[0].context.token_address.toLowerCase();
                if (pools.map((p) => p.id).includes(poolId)) {
                    const apr = parseFloat(item.metrics.apr);

                    const id = `${chain}-${poolId}-fuul-hypurr`;
                    if (aprMap.has(id)) {
                        const existingApr = aprMap.get(id);
                        existingApr!.apr += apr;
                        aprMap.set(id, existingApr!);
                    } else {
                        aprMap.set(id, {
                            id,
                            title: 'Fuul Hypurr',
                            type: PrismaPoolAprType.FUUL,
                            chain,
                            poolId,
                            apr,
                            rewardTokenAddress: null,
                            rewardTokenSymbol: null,
                        });
                    }
                }
            }
        }

        return Array.from(aprMap.values()).map((apr) => ({
            id: apr.id,
            type: apr.type,
            title: apr.title,
            chain: apr.chain,
            poolId: apr.poolId,
            apr: apr.apr,
            rewardTokenAddress: null,
            rewardTokenSymbol: null,
        }));
    }
}
