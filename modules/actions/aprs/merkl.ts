import { $Enums, PrismaPoolAprType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { poolsIncludeForAprs, PoolForAPRs } from '../../../prisma/prisma-types';
import { chainIdToChain } from '../../network/chain-id-to-chain';
import { AllNetworkConfigs } from '../../network/network-config';

const opportunityUrl =
    'https://api.merkl.xyz/v4/opportunities/?test=false&status=LIVE&campaigns=true&mainProtocolId=balancer';

interface MerklOpportunity {
    chainId: number;
    identifier: string;
    apr: number;
    campaigns: {
        params: {
            whitelist: string[];
            forwarders: {
                token: string;
                sender: string;
            }[];
        };
    }[];
}

const fetchMerklOpportunities = async () => {
    const response = await fetch(opportunityUrl);
    const data = (await response.json()) as MerklOpportunity[];

    // remove opportunities with whitelist
    const opportunities = data.filter((opportunity) =>
        opportunity.campaigns.every((campaign) => campaign.params.whitelist.length === 0),
    );

    return opportunities;
};

const fetchForwardedMerklOpportunities = async () => {
    const allOpportunities: MerklOpportunity[] = [];
    for (const chainId of Object.keys(AllNetworkConfigs)) {
        const response = await fetch(
            `https://api.merkl.xyz/v4/opportunities/?test=false&status=LIVE&campaigns=true&items=2000&chainId=${chainId}`,
        );
        const data = (await response.json()) as MerklOpportunity[];

        if (data.length > 0) {
            allOpportunities.push(...data);
        }
    }

    // remove opportunities with whitelist, only add where fowarder is vault v3
    const opportunities = allOpportunities.filter(
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
};

export const syncMerklRewards = async () => {
    const opportunities = await fetchMerklOpportunities();
    const forwardedOpportunities = await fetchForwardedMerklOpportunities();

    const poolIdsFromForwardedOpportunities = forwardedOpportunities
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

    const allAffectedPoolIds = [
        ...opportunities.map((campaign) => campaign.identifier.toLowerCase()),
        ...poolIdsFromForwardedOpportunities,
    ];

    const affectedPools = await prisma.prismaPool.findMany({
        where: {
            address: {
                in: allAffectedPoolIds,
            },
        },
        ...poolsIncludeForAprs,
    });

    const aprsFromOpportunities = mapOpportunitiesToAprs(opportunities, affectedPools);
    const aprsFromForwardedOpportunities = mapForwardedOpportunitiesToAprs(forwardedOpportunities, affectedPools);

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

    await prisma.$transaction([
        prisma.prismaPoolAprItem.deleteMany({ where: { type: PrismaPoolAprType.MERKL } }),
        prisma.prismaPoolAprItem.createMany({ data: data.filter((item) => item !== null) }),
    ]);
};

function mapForwardedOpportunitiesToAprs(
    opportunities: MerklOpportunity[],
    affectedPools: PoolForAPRs[],
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
                    pool.tokens.find((token) => token.address === opportunity.identifier.toLowerCase())?.balanceUSD ||
                    0;
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
        });
    });

    return aprs;
}

function mapOpportunitiesToAprs(
    opportunities: MerklOpportunity[],
    affectedPools: PoolForAPRs[],
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
