import {
    GqlSftmxStakingData,
    GqlSftmxStakingSnapshot,
    GqlSftmxStakingSnapshotDataRange,
    GqlSftmxWithdrawalRequests,
} from '../../schema';
import { prisma } from '../../prisma/prisma-client';
import moment from 'moment';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';

const SFTMX_STACKINGCONTRACT = AllNetworkConfigsKeyedOnChain['FANTOM'].data.sftmx!.stakingContractAddress;

const getTimestampForRange = (range: GqlSftmxStakingSnapshotDataRange): number => {
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
};

export function SftmxQueryController(tracer?: any) {
    return {
        getWithdrawalRequests: async (user: string): Promise<GqlSftmxWithdrawalRequests[]> => {
            const balances = await prisma.prismaSftmxWithdrawalRequest.findMany({
                where: {
                    user: user,
                },
            });
            return balances;
        },

        getStakingData: async (): Promise<GqlSftmxStakingData> => {
            const stakingData = await prisma.prismaSftmxStakingData.findUniqueOrThrow({
                where: { id: SFTMX_STACKINGCONTRACT },
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
        },

        getStakingSnapshots: async (range: GqlSftmxStakingSnapshotDataRange): Promise<GqlSftmxStakingSnapshot[]> => {
            const timestamp = getTimestampForRange(range);

            const stakingSnapshots = await prisma.prismaSftmxStakingDataSnapshot.findMany({
                where: { timestamp: { gte: timestamp } },
                orderBy: { timestamp: 'asc' },
            });

            return stakingSnapshots.map((snapshot) => ({
                id: snapshot.id,
                timestamp: snapshot.timestamp,
                totalFtmAmount: snapshot.totalFtmAmount,
                totalFtmAmountStaked: snapshot.lockedFtmAmount,
                totalFtmAmountInPool: snapshot.freePoolFtmAmount,
                exchangeRate: snapshot.exchangeRate,
            }));
        },
    };
}
