import { PoolAprService } from '../../pool-types';
import { PrismaPoolWithTokens } from '../../../../prisma/prisma-types';
import { prisma } from '../../../../prisma/prisma-client';
import { multicallViem } from '../../../web3/multicaller-viem';
import { mainnet } from 'viem/chains';
import { createPublicClient, formatUnits, http, parseAbi } from 'viem';

const feeDistributorAbi = parseAbi([
    'function getTokensDistributedInWeek(address token, uint timestamp) view returns (uint)',
    'function claimTokens(address user, address[] tokens) returns (uint256[])',
    'function claimToken(address user, address token) returns (uint256)',
]);

const veBalAbi = parseAbi(['function totalSupply() view returns (uint)']);

const feeDistributorAddress = '0xd3cf852898b21fc233251427c2dc93d3d604f3bb';
const balAddress = '0xba100000625a3754423978a60c9317c58a424e3d';
const vebalPool = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
const vebalPoolAddress = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56';
const vebalAddress = '0xc128a9954e6c874ea3d62ce62b468ba073093f25';
const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const id = `${vebalPool}-protocol-apr`;
const chain = 'MAINNET';

const getPreviousWeek = (fromJSTimestamp: number): number => {
    const weeksToGoBack = 1;
    const midnight = new Date(Math.floor(fromJSTimestamp));
    midnight.setUTCHours(0);
    midnight.setUTCMinutes(0);
    midnight.setUTCSeconds(0);
    midnight.setUTCMilliseconds(0);

    let daysSinceThursday = midnight.getUTCDay() - 4;
    if (daysSinceThursday < 0) daysSinceThursday += 7;

    daysSinceThursday = daysSinceThursday + weeksToGoBack * 7;

    return Math.floor(midnight.getTime() / 1000) - daysSinceThursday * 86400;
};

const fetchRevenue = async (timestamp: number, rpcUrl: string) => {
    const previousWeek = getPreviousWeek(timestamp);

    const viemClient = createPublicClient({
        chain: mainnet,
        transport: http(rpcUrl),
    });

    const results = await multicallViem(viemClient, [
        {
            path: 'balAmount',
            address: feeDistributorAddress,
            abi: feeDistributorAbi,
            functionName: 'getTokensDistributedInWeek',
            args: [balAddress, previousWeek],
        },
        {
            path: 'usdcAmount',
            address: feeDistributorAddress,
            abi: feeDistributorAbi,
            functionName: 'getTokensDistributedInWeek',
            args: [usdcAddress, previousWeek],
        },
        {
            path: 'veBalSupply',
            address: vebalAddress,
            abi: veBalAbi,
            functionName: 'totalSupply',
        },
    ]);

    const data = {
        balAmount: parseFloat(formatUnits(results.balAmount, 18)),
        usdcAmount: parseFloat(formatUnits(results.usdcAmount, 6)),
        veBalSupply: parseFloat(formatUnits(results.veBalSupply, 18)),
        usdcPrice: parseFloat('1.0'),
        balAddress: balAddress,
    };

    return data;
};

export class VeBalProtocolAprService implements PoolAprService {
    constructor(private rpcUrl: string) {}

    public getAprServiceName(): string {
        return 'ProtocolAprService';
    }

    async getApr(): Promise<number> {
        const revenue = await fetchRevenue(Date.now(), this.rpcUrl);

        // Prices
        const balPrice = await prisma.prismaTokenCurrentPrice.findFirst({
            where: { tokenAddress: balAddress, chain: 'MAINNET' },
            select: { price: true },
        });

        const usdcPrice = await prisma.prismaTokenCurrentPrice.findFirst({
            where: { tokenAddress: usdcAddress, chain: 'MAINNET' },
            select: { price: true },
        });

        const bptPrice = await prisma.prismaTokenCurrentPrice.findFirst({
            where: { tokenAddress: vebalPoolAddress, chain: 'MAINNET' },
            select: { price: true },
        });

        if (!balPrice || !usdcPrice || !bptPrice) {
            return 0;
        }

        const lastWeekBalRevenue = revenue.balAmount * balPrice.price;
        const lastWeekUsdcRevenue = revenue.usdcAmount * usdcPrice.price;

        const dailyRevenue = (lastWeekBalRevenue + lastWeekUsdcRevenue) / 7;
        const apr = (365 * dailyRevenue) / (bptPrice.price * revenue.veBalSupply);

        return apr;
    }

    async updateAprForPools(pools: PrismaPoolWithTokens[]): Promise<void> {
        const apr = await this.getApr();

        await prisma.prismaPoolAprItem.upsert({
            where: { id_chain: { id, chain: 'MAINNET' } },
            create: {
                id,
                chain,
                poolId: vebalPool,
                apr,
                title: 'Protocol APR',
                type: 'LOCKING',
            },
            update: { apr },
        });
    }
}
