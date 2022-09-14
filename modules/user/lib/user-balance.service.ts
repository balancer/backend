import { UserPoolBalance } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { parseUnits } from 'ethers/lib/utils';
import { formatFixed } from '@ethersproject/bignumber';
import { networkConfig } from '../../config/network-config';
import { PrismaPoolStaking } from '@prisma/client';

export class UserBalanceService {
    public async getUserPoolBalances(address: string): Promise<UserPoolBalance[]> {
        const user = await prisma.prismaUser.findUnique({
            where: { address: address.toLowerCase() },
            include: {
                walletBalances: { where: { poolId: { not: null }, balanceNum: { gt: 0 } } },
                stakedBalances: {
                    where: { poolId: { not: null }, balanceNum: { gt: 0 } },
                },
            },
        });

        if (!user) {
            return [];
        }

        const poolIds = _.uniq([
            ...user.stakedBalances.map((balance) => balance.poolId),
            ...user.walletBalances.map((balance) => balance.poolId),
        ]) as string[];

        return poolIds.map((poolId) => {
            const stakedBalance = user.stakedBalances.find((balance) => balance.poolId === poolId);
            const walletBalance = user.walletBalances.find((balance) => balance.poolId === poolId);
            const stakedNum = parseUnits(stakedBalance?.balance || '0', 18);
            const walletNum = parseUnits(walletBalance?.balance || '0', 18);

            return {
                poolId,
                tokenAddress: stakedBalance?.tokenAddress || walletBalance?.tokenAddress || '',
                totalBalance: formatFixed(stakedNum.add(walletNum), 18),
                stakedBalance: stakedBalance?.balance || '0',
                walletBalance: walletBalance?.balance || '0',
            };
        });
    }

    public async getUserFbeetsBalance(address: string): Promise<Omit<UserPoolBalance, 'poolId'>> {
        const user = await prisma.prismaUser.findUnique({
            where: { address: address.toLowerCase() },
            include: {
                walletBalances: { where: { tokenAddress: networkConfig.fbeets.address } },
                stakedBalances: { where: { tokenAddress: networkConfig.fbeets.address } },
            },
        });

        const stakedBalance = user?.stakedBalances[0];
        const walletBalance = user?.walletBalances[0];
        const stakedNum = parseUnits(stakedBalance?.balance || '0', 18);
        const walletNum = parseUnits(walletBalance?.balance || '0', 18);

        return {
            tokenAddress: networkConfig.fbeets.address,
            totalBalance: formatFixed(stakedNum.add(walletNum), 18),
            stakedBalance: stakedBalance?.balance || '0',
            walletBalance: walletBalance?.balance || '0',
        };
    }

    public async getUserStaking(address: string): Promise<PrismaPoolStaking[]> {
        const user = await prisma.prismaUser.findUnique({
            where: { address },
            include: {
                stakedBalances: {
                    where: { balanceNum: { gt: 0 } },
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
