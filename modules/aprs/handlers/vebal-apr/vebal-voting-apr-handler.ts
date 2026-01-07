import { Chain, PrismaPoolAprItem, PrismaPoolAprType } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { AprHandler, PoolAPRData } from '../../types';

const STAKEDAO_METADATA =
    'https://raw.githubusercontent.com/stake-dao/votemarket-analytics/refs/heads/main/analytics/votemarket-analytics/balancer/rounds-metadata.json';
const STAKE_DAO_ANALYTICS_BASE_URL =
    'https://raw.githubusercontent.com/stake-dao/votemarket-analytics/refs/heads/main/analytics/votemarket-analytics/balancer/';
const veBalPoolAddress = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56';

const veBalPoolId = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
const aprItemId = `${veBalPoolId}-voting-apr`;
const chain = 'MAINNET';

type StakeDaoMetadataResponse = {
    id: string;
    endVoting: number;
}[];

type StakeDaoAlyticsResponse = {
    globalAverageDollarPerVote: number;
};

const fetchLatestStakeDaoRound = async () => {
    const response = await fetch(`${STAKEDAO_METADATA}`);
    const data = (await response.json()) as StakeDaoMetadataResponse;
    if (!data) {
        throw new Error('Failed to fetch voting APR');
    }

    return data[data.length - 1];
};

const fetchStakeDaoValuePerVote = async (roundNumber: number) => {
    const response = await fetch(`${STAKE_DAO_ANALYTICS_BASE_URL}/${roundNumber}.json`);
    const data = (await response.json()) as StakeDaoAlyticsResponse;
    return data.globalAverageDollarPerVote;
};

export const getStakeDaoApr = async (roundNumber: number, timestamp: number) => {
    const avgValuePerVote = await fetchStakeDaoValuePerVote(roundNumber);

    let veBalPrice;
    // When the timestamp is older than 24 hours, we can fetch the historical price
    if (timestamp < Math.ceil(+Date.now() / 1000) - 86400) {
        veBalPrice = await prisma.prismaTokenPrice.findFirst({
            where: {
                tokenAddress: veBalPoolAddress,
                chain: Chain.MAINNET,
                timestamp: timestamp,
            },
        });
    }
    // Otherwise we fetch the current price
    else {
        veBalPrice = await prisma.prismaTokenCurrentPrice.findFirst({
            where: {
                tokenAddress: veBalPoolAddress,
                chain: Chain.MAINNET,
            },
        });
    }

    if (!veBalPrice) {
        throw new Error('Failed to fetch veBAL price');
    }

    const apr = (avgValuePerVote * 52) / veBalPrice.price;

    return apr;
};

export class VeBalVotingAprHandler implements AprHandler {
    public getAprServiceName(): string {
        return 'VeBalVotingAprHandler';
    }

    async getApr(): Promise<number> {
        // Get APRs for last 3 weeks, if available
        const round = await fetchLatestStakeDaoRound();

        const aprs = await Promise.allSettled([
            getStakeDaoApr(parseFloat(round.id), round.endVoting),
            getStakeDaoApr(parseFloat(round.id) - 1, round.endVoting),
            getStakeDaoApr(parseFloat(round.id) - 2, round.endVoting),
        ]);

        // Average successfully fetched APRs
        const avg = aprs
            .filter((apr): apr is PromiseFulfilledResult<number> => apr.status === 'fulfilled')
            .map((apr) => apr.value);

        if (avg.length === 0) {
            throw new Error('Failed to fetch APRs');
        }

        return avg.reduce((acc, val) => acc + val, 0) / avg.length;
    }

    public async calculateAprForPools(
        pools: PoolAPRData[],
    ): Promise<Omit<PrismaPoolAprItem, 'createdAt' | 'updatedAt'>[]> {
        if (!pools.map((pool) => pool.id).includes(veBalPoolId)) {
            return [];
        }
        const apr = await this.getApr();

        return [
            {
                id: aprItemId,
                chain,
                poolId: veBalPoolId,
                apr,
                title: 'Voting APR',
                type: PrismaPoolAprType.VOTING,
                rewardTokenAddress: null,
                rewardTokenSymbol: null,
            },
        ];
    }
}
