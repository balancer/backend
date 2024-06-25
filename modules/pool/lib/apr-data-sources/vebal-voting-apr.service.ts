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

    return { total, votes };
};

const getThursdaysTimestamp = (weeksAgo: number) => {
    const now = new Date(); // create a new Date object
    const day = now.getUTCDay(); // get the day of the week in UTC
    const diff = now.getUTCDate() - day + (day === 0 ? -6 : 4); // calculate the last Thursday
    now.setUTCDate(diff); // set the date to that Thursday
    now.setUTCHours(0, 0, 0, 0); // set time to 00:00:00.000
    now.setUTCDate(now.getUTCDate() - weeksAgo * 7); // go back by the specified number of weeks
    return now.getTime() / 1000; // return the timestamp in seconds
};

export const getHiddenHandAPR = async (weeksAgo = 0) => {
    const timestamp = getThursdaysTimestamp(weeksAgo);
    const round = await fetchHiddenHandRound(timestamp);

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
        const aprs = await Promise.allSettled([getHiddenHandAPR(), getHiddenHandAPR(1), getHiddenHandAPR(2)]);

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
