import { $Enums, PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { AprHandler, PoolAPRData } from '../../types';
import { chainIdToChain } from '../../../network/chain-id-to-chain';

const opportunityUrl =
    'https://api.merkl.xyz/v4/opportunities/?test=false&status=LIVE&campaigns=true&mainProtocolId=balancer';

interface MerklOpportunity {
    chainId: number;
    identifier: string;
    dailyRewards: number;
    campaigns: {
        params: {
            whitelist: string[];
        };
    }[];
}

export class MerklAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'MerklAprHandler';
    }

    private async fetchMerklOpportunities() {
        const response = await fetch(opportunityUrl);
        const data = (await response.json()) as MerklOpportunity[];

        // remove opportunities with whitelist
        const opportunities = data.filter((opportunity) =>
            opportunity.campaigns.every((campaign) => campaign.params.whitelist.length === 0),
        );

        return opportunities;
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const chain = pools[0].chain;

        const opportunities = await this.fetchMerklOpportunities();

        const allAffectedPoolAddresses = opportunities.map((campaign) => campaign.identifier.toLowerCase());

        const affectedPools = pools.filter((pool) => allAffectedPoolAddresses.includes(pool.address.toLowerCase()));

        const aprsFromOpportunities = this.mapOpportunitiesToAprs(opportunities, affectedPools);

        const data = aprsFromOpportunities;

        return data.map((apr) => ({
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

    private mapOpportunitiesToAprs(
        opportunities: MerklOpportunity[],
        affectedPools: PoolAPRData[],
    ): {
        id: string;
        type: PrismaPoolAprType;
        title: string;
        chain: $Enums.Chain;
        poolId: string;
        apr: number;
    }[] {
        const aprs: {
            id: string;
            type: PrismaPoolAprType;
            title: string;
            chain: $Enums.Chain;
            poolId: string;
            apr: number;
        }[] = [];

        for (const opportunity of opportunities) {
            const pool = affectedPools.find(
                (pool) =>
                    pool.address === opportunity.identifier.toLowerCase() &&
                    pool.chain === chainIdToChain[opportunity.chainId],
            );

            if (!pool || !pool.dynamicData?.totalLiquidity) {
                continue;
            }

            aprs.push({
                id: `${pool.id}-merkl`,
                type: PrismaPoolAprType.MERKL,
                title: `Merkl Rewards`,
                chain: chainIdToChain[opportunity.chainId],
                poolId: pool.id,
                apr: (opportunity.dailyRewards * 365) / pool.dynamicData.totalLiquidity,
            });
        }

        return aprs.filter((item) => item !== null);
    }
}
