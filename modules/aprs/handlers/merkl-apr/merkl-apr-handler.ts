import { $Enums, PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { AprHandler, PoolAPRData } from '../../types';
import { chainIdToChain, chainToChainId } from '../../../network/chain-id-to-chain';

const opportunityUrl =
    'https://api.merkl.xyz/v4/opportunities/?test=false&status=LIVE&campaigns=true&mainProtocolId=balancer';

interface MerklOpportunity {
    chainId: number;
    identifier: string;
    apr: number;
    tvl: number;
    campaigns: {
        startTimestamp: number;
        endTimestamp: number;
        params: {
            whitelist: string[];
            forwarders: {
                token: string;
                sender: string;
            }[];
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
        const opportunities = data.filter(
            (opportunity) =>
                opportunity.tvl > 0 &&
                opportunity.campaigns.every((campaign) => campaign.params.whitelist.length === 0),
        );

        return opportunities;
    }

    private async fetchForwardedMerklOpportunities(chainId: string) {
        const response = await fetch(
            `https://api.merkl.xyz/v4/opportunities/?test=false&status=LIVE&campaigns=true&items=100&chainId=${chainId}`,
        );
        const data = (await response.json()) as MerklOpportunity[];

        // remove opportunities with whitelist, only add where fowarder is vault v3
        const opportunities = data.filter(
            (opportunity) =>
                opportunity.campaigns.every(
                    (campaign) => campaign.params.whitelist && campaign.params.whitelist.length === 0,
                ) &&
                opportunity.campaigns.some((campaign) =>
                    campaign.params.forwarders.some(
                        (forwarder) => forwarder.sender.toLowerCase() === '0xba1333333333a1ba1108e8412f11850a5c319ba9',
                    ),
                ),
        );
        return opportunities;
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        const chain = pools[0].chain;
        const chainId = chainToChainId[chain];

        const opportunities = await this.fetchMerklOpportunities();
        const forwardedOpportunities = await this.fetchForwardedMerklOpportunities(chainId);

        const poolAddressesFromForwardedOpportunities = forwardedOpportunities
            .map((opportunity) =>
                opportunity.campaigns.map((campaign) =>
                    campaign.params.forwarders.map((forwarder) => {
                        if (forwarder.sender.toLowerCase() !== '0xba1333333333a1ba1108e8412f11850a5c319ba9') {
                            return null;
                        }
                        return forwarder.token.toLowerCase();
                    }),
                ),
            )
            .flat(2)
            .filter((item) => item !== null) as string[];

        const allAffectedPoolAddresses = [
            ...opportunities.map((campaign) => campaign.identifier.toLowerCase()),
            ...poolAddressesFromForwardedOpportunities,
        ];

        const affectedPools = pools.filter((pool) => allAffectedPoolAddresses.includes(pool.address.toLowerCase()));

        const aprsFromOpportunities = this.mapOpportunitiesToAprs(opportunities, affectedPools);
        const aprsFromForwardedOpportunities = this.mapForwardedOpportunitiesToAprs(
            forwardedOpportunities,
            affectedPools,
        );

        const data = aprsFromOpportunities;

        for (const forwardedOpportunity of aprsFromForwardedOpportunities) {
            const existingApr = data.find(
                (apr) => apr.poolId === forwardedOpportunity.poolId && apr.chain === forwardedOpportunity.chain,
            );
            if (existingApr) {
                existingApr.apr += forwardedOpportunity.apr;
            } else {
                data.push(forwardedOpportunity);
            }
        }

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

    private mapForwardedOpportunitiesToAprs(
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

        opportunities.forEach((opportunity) => {
            opportunity.campaigns.forEach((campaign) => {
                if (campaign.startTimestamp < Date.now() / 1000 && campaign.endTimestamp > Date.now() / 1000) {
                    campaign.params.forwarders.forEach((forwarder) => {
                        if (forwarder.sender.toLowerCase() !== '0xba1333333333a1ba1108e8412f11850a5c319ba9') {
                            return;
                        }

                        const pool = affectedPools.find(
                            (pool) =>
                                pool.address === forwarder.token.toLowerCase() &&
                                pool.chain === chainIdToChain[opportunity.chainId],
                        );

                        if (!pool) {
                            return;
                        }

                        const tokenBalanceUsd =
                            pool.tokens.find((token) => token.address === opportunity.identifier.toLowerCase())
                                ?.balanceUSD || 0;
                        const totalLiquidity = pool.tokens.map((t) => t.balanceUSD).reduce((a, b) => a + b, 0);
                        const poolApr = opportunity.apr * (tokenBalanceUsd / totalLiquidity) || 0;

                        if (poolApr === 0) {
                            return;
                        }

                        aprs.push({
                            id: `${pool.id}-merkl-forwarded-${opportunity.identifier}`,
                            type: PrismaPoolAprType.MERKL,
                            title: `Merkl Forwarded Rewards`,
                            chain: chainIdToChain[opportunity.chainId],
                            poolId: pool.id,
                            apr: poolApr / 100,
                        });
                    });
                }
            });
        });

        return aprs;
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
            const poolId = affectedPools.find(
                (pool) =>
                    pool.address === opportunity.identifier.toLowerCase() &&
                    pool.chain === chainIdToChain[opportunity.chainId],
            )?.id;

            if (!poolId) {
                continue;
            }

            aprs.push({
                id: `${poolId}-merkl`,
                type: PrismaPoolAprType.MERKL,
                title: `Merkl Rewards`,
                chain: chainIdToChain[opportunity.chainId],
                poolId: poolId,
                apr: opportunity.apr / 100,
            });
        }

        return aprs.filter((item) => item !== null);
    }
}
