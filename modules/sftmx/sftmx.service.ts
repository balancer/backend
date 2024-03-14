import { prisma } from '../../prisma/prisma-client';
import { GqlSftmxStakingData, GqlSftmxWithdrawalRequests } from '../../schema';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';

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
}

export const sftmxService = new SftmxService(
    AllNetworkConfigsKeyedOnChain['FANTOM'].data.sftmx!.stakingContractAddress,
);
