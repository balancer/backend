import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithTokens } from '../../../../prisma/prisma-types';
import { Chain } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';

const HIDDEN_HAND_API_URL = 'https://api.hiddenhand.finance/proposal/balancer';
const VEBAL = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56';

const vebalPool = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
const id = `${vebalPool}-voting-apr`;
const chain = 'MAINNET';

type HiddenHandResponse = {
    error: boolean;
    data: {
        poolId: string;
        proposal: string;
        proposalHash: string;
        title: string;
        proposalDeadline: number;
        totalValue: number;
        maxTotalValue: number;
        voteCount: number;
        valuePerVote: number;
        maxValuePerVote: number;
        bribes: {
            token: string;
            symbol: string;
            decimals: number;
            value: number;
            maxValue: number;
            amount: number;
            maxTokensPerVote: number;
            briber: string;
            periodIndex: number;
            chainId: number;
        }[];
    }[];
};

const fetchHiddenHandRound = async (timestamp?: number) => {
    const response = await fetch(`${HIDDEN_HAND_API_URL}/${timestamp || ''}`);
    const data = (await response.json()) as HiddenHandResponse;
    if (data.error) {
        throw new Error('Failed to fetch voting APR');
    }

    // Get sum of all incentivized votes and total value
    const total = data.data.reduce((acc, proposal) => acc + proposal.totalValue, 0);
    const votes = data.data
        .filter((proposal) => proposal.totalValue > 0)
        .reduce((acc, proposal) => acc + proposal.voteCount, 0);

    return { total, votes, timestamp: data.data[0].proposalDeadline };
};

export const getHiddenHandAPR = async (timestamp: number) => {
    const round = await fetchHiddenHandRound(timestamp);

    // Debugging purposes
    console.log('Hiddenhand round', timestamp, round.timestamp, round.total, round.votes);

    timestamp = round.timestamp;

    const avgValuePerVote = round.total / round.votes;

    let veBalPrice;
    // When the timestamp is older than 24 hours, we can fetch the historical price
    if (timestamp < Math.ceil(+Date.now() / 1000) - 86400) {
        veBalPrice = await prisma.prismaTokenPrice.findFirst({
            where: {
                tokenAddress: VEBAL,
                chain: Chain.MAINNET,
                timestamp,
            },
        });
    }
    // Otherwise we fetch the current price
    else {
        veBalPrice = await prisma.prismaTokenCurrentPrice.findFirst({
            where: {
                tokenAddress: VEBAL,
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

export class VeBalVotingAprService implements PoolAprService {
    constructor() {}

    public getAprServiceName(): string {
        return 'VeBalVotingAprService';
    }

    async getApr(): Promise<number> {
        // Get APRs for last 3 weeks, if available
        const timestamp = (await fetchHiddenHandRound()).timestamp;

        const aprs = await Promise.allSettled([
            getHiddenHandAPR(timestamp - 1 * 604800),
            getHiddenHandAPR(timestamp - 2 * 604800),
            getHiddenHandAPR(timestamp - 3 * 604800),
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

    async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
        const apr = await this.getApr();

        await prisma.prismaPoolAprItem.upsert({
            where: { id_chain: { id, chain } },
            create: {
                id,
                chain,
                poolId: vebalPool,
                apr,
                title: 'Voting APR',
                type: 'VOTING',
            },
            update: { apr },
        });
    }
}
