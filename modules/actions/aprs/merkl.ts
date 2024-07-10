import { PrismaPoolAprType } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { chainIdToChain } from '../../network/chain-id-to-chain';

const url = 'https://api.merkl.xyz/v3/campaigns?types=1&live=true';

interface MerklCampaign {
    chainId: number;
    computeChainId: number;
    apr: number;
    type: 'balancerPool';
    typeInfo: {
        poolId: string;
    };
    campaignParameters: {
        symbolRewardToken: string;
    };
}

interface MerklCampaigns {
    [chainId: number]: {
        [typeAddress: string]: {
            [campaignId: number]: MerklCampaign;
        };
    };
}

const fetchMerklCampaigns = async () => {
    const response = await fetch(url);
    const data = (await response.json()) as MerklCampaigns;
    // Flatten the data
    const campaigns = Object.values(data)
        .map((chain) => {
            return Object.values(chain).map((type: any) => {
                return Object.values(type) as MerklCampaign[];
            });
        })
        .flat(2)
        .filter((campaign) => campaign.type === 'balancerPool');

    return campaigns;
};

export const syncMerklRewards = async () => {
    const campaigns = await fetchMerklCampaigns();

    const data = campaigns
        .map((campaign) => ({
            id: `${campaign.typeInfo.poolId}-merkl`,
            type: PrismaPoolAprType.MERKL,
            title: `Merkl Rewards`,
            chain: chainIdToChain[campaign.computeChainId],
            poolId: campaign.typeInfo.poolId,
            apr: campaign.apr / 100,
        }))
        .reduce((acc, item) => {
            if (acc[item.id]) {
                acc[item.id].apr += item.apr;
            } else {
                acc[item.id] = { ...item };
            }
            return acc;
        }, {} as Record<string, any>);

    await prisma.$transaction([
        prisma.prismaPoolAprItem.deleteMany({ where: { type: PrismaPoolAprType.MERKL } }),
        prisma.prismaPoolAprItem.createMany({ data: Object.values(data) }),
    ]);
};
