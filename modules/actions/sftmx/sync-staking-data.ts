import { prisma } from '../../../prisma/prisma-client';
import { fetchSftmxStakingData } from '../../sources/contracts/fetch-sftmx-staking-data';
import { Address, formatEther } from 'viem';
import { ViemClient } from '../../sources/viem-client';

export async function syncStakingData(stakingContractAddress: Address, viemClient: ViemClient) {
    const stakingData = await fetchSftmxStakingData(stakingContractAddress, viemClient);

    await prisma.prismaSftmxStakingData.upsert({
        where: { id: stakingContractAddress },
        create: {
            id: stakingContractAddress,
            exchangeRate: formatEther(stakingData.exchangeRate),
            totalFtm: formatEther(stakingData.totalFtm),
            totalFtmInPool: formatEther(stakingData.totalFtmInPool),
            totalFtmStaked: formatEther(stakingData.totalFtmStaked),
            numberOfVaults: parseFloat(stakingData.numberOfVaults.toString()),
            maintenancePaused: stakingData.maintenancePaused,
            undelegatePaused: stakingData.undelegatePaused,
            withdrawPaused: stakingData.withdrawPaused,
            maxDepositLimit: formatEther(stakingData.maxDepositLimit),
            minDepositLimit: formatEther(stakingData.minDepositLimit),
            withdrawalDelay: parseFloat(stakingData.withdrawalDelay.toString()),
            stakingApr: `${stakingData.stakingApr}`,
        },
        update: {
            id: stakingContractAddress,
            exchangeRate: formatEther(stakingData.exchangeRate),
            totalFtm: formatEther(stakingData.totalFtm),
            totalFtmInPool: formatEther(stakingData.totalFtmInPool),
            totalFtmStaked: formatEther(stakingData.totalFtmStaked),
            numberOfVaults: parseFloat(stakingData.numberOfVaults.toString()),
            maintenancePaused: stakingData.maintenancePaused,
            undelegatePaused: stakingData.undelegatePaused,
            withdrawPaused: stakingData.withdrawPaused,
            maxDepositLimit: formatEther(stakingData.maxDepositLimit),
            minDepositLimit: formatEther(stakingData.minDepositLimit),
            withdrawalDelay: parseFloat(stakingData.withdrawalDelay.toString()),
            stakingApr: `${stakingData.stakingApr}`,
        },
    });

    await prisma.prismaSftmxVault.deleteMany({ where: { id: { notIn: stakingData.vaults.map((vault) => vault.id) } } });

    for (const vaultData of stakingData.vaults) {
        await prisma.prismaSftmxVault.upsert({
            where: { id: vaultData.id },
            create: {
                id: vaultData.id,
                vaultIndex: parseFloat(vaultData.vaultIndex.toString()),
                ftmStaked: formatEther(vaultData.ftmStaked),
                unlockTimestamp: parseFloat(vaultData.unlockTimestamp.toString()),
                validatorAddress: vaultData.validatorAddress,
                validatorId: vaultData.validatorId.toString(),
                matured: vaultData.matured,
                ftmStakingId: stakingContractAddress,
            },
            update: {
                vaultIndex: parseFloat(vaultData.vaultIndex.toString()),
                matured: vaultData.matured,
            },
        });
    }
}
