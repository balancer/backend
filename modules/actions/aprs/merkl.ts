import { PrismaPoolAprType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { chainIdToChain } from '../../network/chain-id-to-chain';

const url = 'https://api.merkl.xyz/v4/opportunities/?test=false&status=LIVE&campaigns=true&mainProtocolId=balancer';

interface MerklOpportunity {
    chainId: number;
    identifier: string;
    apr: number;
    campaigns: {
        params: {
            whitelist: string[];
        };
    }[];
}

const fetchMerklCampaigns = async () => {
    const response = await fetch(url);
    const data = (await response.json()) as MerklOpportunity[];

    // remove opportunities with whitelist
    const campaigns = data.filter((opportunity) =>
        opportunity.campaigns.every((campaign) => campaign.params.whitelist.length === 0),
    );

    return campaigns;
};

export const syncMerklRewards = async () => {
    const campaigns = await fetchMerklCampaigns();

    const affectedPools = await prisma.prismaPool.findMany({
        where: {
            address: { in: campaigns.map((campaign) => campaign.identifier.toLowerCase()) },
        },
        select: { id: true, address: true, chain: true },
    });

    const data = campaigns.map((campaign) => {
        const poolId = affectedPools.find(
            (pool) =>
                pool.address === campaign.identifier.toLowerCase() && pool.chain === chainIdToChain[campaign.chainId],
        )?.id;

        if (!poolId) {
            return null;
        }

        return {
            id: `${poolId}-merkl`,
            type: PrismaPoolAprType.MERKL,
            title: `Merkl Rewards`,
            chain: chainIdToChain[campaign.chainId],
            poolId: poolId,
            apr: campaign.apr / 100,
        };
    });

    await prisma.$transaction([
        prisma.prismaPoolAprItem.deleteMany({ where: { type: PrismaPoolAprType.MERKL } }),
        prisma.prismaPoolAprItem.createMany({ data: data.filter((item) => item !== null) }),
    ]);
};
