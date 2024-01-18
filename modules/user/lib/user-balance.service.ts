import { UserPoolBalance } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { parseUnits } from 'ethers/lib/utils';
import { formatFixed } from '@ethersproject/bignumber';
import { Chain, PrismaPoolStaking } from '@prisma/client';
import { networkContext } from '../../network/network-context.service';

export class UserBalanceService {
    constructor() {}

    public async getUserPoolBalances(address: string, chains: Chain[]): Promise<UserPoolBalance[]> {
        // this seems to cause heavy load
        // const user = await prisma.prismaUser.findUnique({
        //     where: { address: address.toLowerCase() },
        //     include: {
        //         walletBalances: {
        //             where: { chain: { in: chains }, poolId: { not: null }, balanceNum: { gt: 0 } },
        //         },
        //         stakedBalances: {
        //             where: { chain: { in: chains }, poolId: { not: null }, balanceNum: { gt: 0 } },
        //         },
        //     },
        // });

        const userWalletBalances = await prisma.prismaUserWalletBalance.findMany({
            where: {
                userAddress: address.toLowerCase(),
                chain: { in: chains },
                poolId: { not: null },
                balanceNum: { gt: 0 },
            },
        });

        const userStakedBalances = await prisma.prismaUserStakedBalance.findMany({
            where: {
                userAddress: address.toLowerCase(),
                chain: { in: chains },
                poolId: { not: null },
                balanceNum: { gt: 0 },
            },
        });

        if (userWalletBalances.length === 0 && userStakedBalances.length === 0) {
            return [];
        }

        const poolIds = _.uniq([
            ...userStakedBalances.map((balance) => balance.poolId),
            ...userWalletBalances.map((balance) => balance.poolId),
        ]) as string[];

        return poolIds.map((poolId) => {
            const stakedBalance = userStakedBalances.find((balance) => balance.poolId === poolId);
            const walletBalance = userWalletBalances.find((balance) => balance.poolId === poolId);
            const stakedNum = parseUnits(stakedBalance?.balance || '0', 18);
            const walletNum = parseUnits(walletBalance?.balance || '0', 18);

            return {
                poolId,
                tokenAddress: stakedBalance?.tokenAddress || walletBalance?.tokenAddress || '',
                totalBalance: formatFixed(stakedNum.add(walletNum), 18),
                stakedBalance: stakedBalance?.balance || '0',
                walletBalance: walletBalance?.balance || '0',
                // the prisma query above ensures that one of these balances exists
                chain: (stakedBalance?.chain || walletBalance?.chain)!,
            };
        });
    }

    public async getUserFbeetsBalance(address: string): Promise<Omit<UserPoolBalance, 'poolId'>> {
        const fbeetsAddress = networkContext.data.fbeets?.address || '';

        const userWalletBalances = await prisma.prismaUserWalletBalance.findMany({
            where: { userAddress: address.toLowerCase(), chain: networkContext.chain, tokenAddress: fbeetsAddress },
        });

        const userStakedBalances = await prisma.prismaUserStakedBalance.findMany({
            where: { userAddress: address.toLowerCase(), chain: networkContext.chain, tokenAddress: fbeetsAddress },
        });

        // this seems to cause heavy load
        // const user = await prisma.prismaUser.findUnique({
        //     where: { address: address.toLowerCase() },
        //     include: {
        //         walletBalances: { where: { chain: networkContext.chain, tokenAddress: fbeetsAddress } },
        //         stakedBalances: { where: { chain: networkContext.chain, tokenAddress: fbeetsAddress } },
        //     },
        // });

        const stakedBalance = userWalletBalances[0];
        const walletBalance = userStakedBalances[0];
        const stakedNum = parseUnits(stakedBalance?.balance || '0', 18);
        const walletNum = parseUnits(walletBalance?.balance || '0', 18);

        return {
            tokenAddress: fbeetsAddress,
            totalBalance: formatFixed(stakedNum.add(walletNum), 18),
            stakedBalance: stakedBalance?.balance || '0',
            walletBalance: walletBalance?.balance || '0',
            chain: networkContext.chain,
        };
    }

    public async getUserStaking(address: string, chains: Chain[]): Promise<PrismaPoolStaking[]> {
        const user = await prisma.prismaUser.findUnique({
            where: { address },
            include: {
                stakedBalances: {
                    where: { chain: { in: chains }, balanceNum: { gt: 0 } },
                    include: {
                        staking: {
                            include: {
                                farm: {
                                    include: {
                                        rewarders: true,
                                    },
                                },
                                gauge: {
                                    include: {
                                        rewards: true,
                                    },
                                },
                                reliquary: true,
                            },
                        },
                    },
                },
            },
        });

        return (user?.stakedBalances || [])
            .filter((stakedBalance) => stakedBalance.staking)
            .map((stakedBalance) => stakedBalance.staking);
    }
}
