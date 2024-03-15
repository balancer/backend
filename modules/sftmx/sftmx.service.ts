import moment from 'moment';
import { prisma } from '../../prisma/prisma-client';
import {
    GqlSftmxStakingData,
    GqlSftmxStakingSnapshot,
    GqlSftmxStakingSnapshotDataRange,
    GqlSftmxWithdrawalRequests,
} from '../../schema';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';
import { snapshot } from 'viem/_types/actions/test/snapshot';

export class SftmxService {
    constructor(private readonly stakingContractAddress: string) {}

    public async getWithdrawalRequests(user: string): Promise<GqlSftmxWithdrawalRequests[]> {
        const balances = await prisma.prismaSftmxWithdrawalRequest.findMany({
            where: {
                user: user,
            },
        });
        return balances;
    }

    public async getStakingData(): Promise<GqlSftmxStakingData> {
        const stakingData = await prisma.prismaSftmxStakingData.findUniqueOrThrow({
            where: { id: this.stakingContractAddress },
            include: {
                vaults: true,
            },
        });
        return {
            totalFtmAmountInPool: stakingData.totalFtmInPool,
            numberOfVaults: stakingData.numberOfVaults,
            totalFtmAmountStaked: stakingData.totalFtmStaked,
            totalFtmAmount: stakingData.totalFtm,
            maxDepositLimit: stakingData.maxDepositLimit,
            minDepositLimit: stakingData.minDepositLimit,
            maintenancePaused: stakingData.maintenancePaused,
            undelegatePaused: stakingData.undelegatePaused,
            withdrawPaused: stakingData.withdrawPaused,
            stakingApr: stakingData.stakingApr,
            exchangeRate: stakingData.exchangeRate,
            withdrawalDelay: stakingData.withdrawalDelay,
            vaults: stakingData.vaults.map((vault) => ({
                vaultAddress: vault.id,
                ftmAmountStaked: vault.ftmStaked,
                isMatured: vault.matured,
                unlockTimestamp: vault.unlockTimestamp,
                validatorAddress: vault.validatorAddress,
                validatorId: vault.validatorId,
                vaultIndex: vault.vaultIndex,
            })),
        };
    }

    public async getStakingSnapshots(range: GqlSftmxStakingSnapshotDataRange): Promise<GqlSftmxStakingSnapshot[]> {
        const timestamp = this.getTimestampForRange(range);

        const stakingSnapshots = await prisma.prismaSftmxStakingDataSnapshot.findMany({
            where: { timestamp: { gte: timestamp } },
            orderBy: { timestamp: 'asc' },
        });

        return stakingSnapshots.map((snapshot) => ({
            id: snapshot.id,
            timestamp: snapshot.timestamp,
            totalFtmAmount: snapshot.totalFtmAmount,
            totalFtmAmountStaked: snapshot.totalFtmAmount,
            totalFtmAmountInPool: snapshot.freePoolFtmAmount,
            exchangeRate: snapshot.exchangeRate,
        }));
    }

    private getTimestampForRange(range: GqlSftmxStakingSnapshotDataRange): number {
        switch (range) {
            case 'THIRTY_DAYS':
                return moment().startOf('day').subtract(30, 'days').unix();
            case 'NINETY_DAYS':
                return moment().startOf('day').subtract(90, 'days').unix();
            case 'ONE_HUNDRED_EIGHTY_DAYS':
                return moment().startOf('day').subtract(180, 'days').unix();
            case 'ONE_YEAR':
                return moment().startOf('day').subtract(365, 'days').unix();
            case 'ALL_TIME':
                return 0;
        }
    }
}

export const sftmxService = new SftmxService(
    AllNetworkConfigsKeyedOnChain['FANTOM'].data.sftmx!.stakingContractAddress,
);
