import { Address, formatEther } from 'viem';
import FTMStaking from './abis/FTMStaking';
import SftmxVault from './abis/SftmxVault';
import SFC from './abis/SFC';
import { ViemClient } from '../types';
import { ZERO_ADDRESS } from '@balancer/sdk';

export interface OnchainSftmxStakingData {
    totalFtmStaked: bigint;
    totalFtmInPool: bigint;
    numberOfVaults: bigint;
    totalFtm: bigint;
    maxDepositLimit: bigint;
    minDepositLimit: bigint;
    maintenancePaused: boolean;
    undelegatePaused: boolean;
    withdrawPaused: boolean;
    stakingApr: number;
    exchangeRate: bigint;
    withdrawalDelay: bigint;
    vaults: OnchainSftmxVaultData[];
}

export interface OnchainSftmxVaultData {
    id: Address;
    ftmStaked: bigint;
    ftmStakingId: Address;
    matured: boolean;
    unlockTimestamp: bigint;
    validatorAddress: Address;
    validatorId: bigint;
    vaultIndex: bigint;
}

const SFC_ADDRESS = '0xFC00FACE00000000000000000000000000000000';

export async function fetchSftmxStakingData(
    stakingContractAddress: Address,
    client: ViemClient,
): Promise<OnchainSftmxStakingData> {
    const stakingContractArgs = {
        address: stakingContractAddress,
        abi: FTMStaking,
    };

    const [
        currentVaultCount,
        currentVaultPtr,
        poolBalance,
        totalFtm,
        maxDeposit,
        minDeposit,
        maintenancePaused,
        undelegatePaused,
        withdrawPaused,
        exchangeRate,
        withdrawalDelay,
    ] = await client.multicall({
        contracts: [
            {
                ...stakingContractArgs,
                functionName: 'currentVaultCount',
            },
            {
                ...stakingContractArgs,
                functionName: 'currentVaultPtr',
            },
            {
                ...stakingContractArgs,
                functionName: 'getPoolBalance',
            },
            {
                ...stakingContractArgs,
                functionName: 'totalFTMWorth',
            },
            {
                ...stakingContractArgs,
                functionName: 'maxDeposit',
            },
            {
                ...stakingContractArgs,
                functionName: 'minDeposit',
            },
            {
                ...stakingContractArgs,
                functionName: 'maintenancePaused',
            },
            {
                ...stakingContractArgs,
                functionName: 'undelegatePaused',
            },
            {
                ...stakingContractArgs,
                functionName: 'withdrawPaused',
            },
            {
                ...stakingContractArgs,
                functionName: 'getExchangeRate',
            },
            {
                ...stakingContractArgs,
                functionName: 'withdrawalDelay',
            },
        ],
        allowFailure: false,
    });

    const totalFtmStaked = totalFtm - poolBalance;

    const maxLockApr = 0.0647;
    const validatorFee = 0.15;
    const sftmxFee = 0.1;
    const stakingApr =
        (parseFloat(formatEther(totalFtmStaked)) / parseFloat(formatEther(totalFtm))) *
        (maxLockApr * (1 - validatorFee)) *
        (1 - sftmxFee);

    const stakingData: OnchainSftmxStakingData = {
        totalFtmStaked: totalFtmStaked,
        totalFtmInPool: poolBalance,
        numberOfVaults: currentVaultCount,
        totalFtm: totalFtm,
        maxDepositLimit: maxDeposit,
        minDepositLimit: minDeposit,
        maintenancePaused: maintenancePaused,
        undelegatePaused: undelegatePaused,
        withdrawPaused: withdrawPaused,
        stakingApr: stakingApr,
        exchangeRate: exchangeRate,
        withdrawalDelay: withdrawalDelay,
        vaults: [],
    };

    const maturedVaultCount = await client.readContract({
        abi: FTMStaking,
        address: stakingContractAddress,
        functionName: 'getMaturedVaultLength',
    });

    const maturedVaults: { address: Address; index: bigint }[] = [];

    for (let i = 0n; i < maturedVaultCount; i++) {
        const maturedVaultAddress = await client.readContract({
            abi: FTMStaking,
            address: stakingContractAddress,
            functionName: 'getMaturedVault',
            args: [i],
        });
        maturedVaults.push({ address: maturedVaultAddress, index: i });
    }

    for (let i = 1n; i <= stakingData.numberOfVaults; i++) {
        const vaultIndex = currentVaultPtr - i;
        const vaultAddress = await client.readContract({
            abi: FTMStaking,
            address: stakingContractAddress,
            functionName: 'getVault',
            args: [vaultIndex],
        });

        if (vaultAddress === ZERO_ADDRESS) {
            continue;
        }

        const validatorId = await client.readContract({
            abi: SftmxVault,
            address: vaultAddress,
            functionName: 'toValidatorID',
        });
        const validatorAddress = await client.readContract({
            abi: SftmxVault,
            address: vaultAddress,
            functionName: 'toValidator',
        });

        const [lockedStake, fromEpoch, endTime, duration] = await client.readContract({
            abi: SFC,
            address: SFC_ADDRESS,
            functionName: 'getLockupInfo',
            args: [vaultAddress, validatorId],
        });
        stakingData.vaults.push({
            id: vaultAddress,
            ftmStaked: lockedStake,
            ftmStakingId: stakingContractAddress,
            matured: false,
            unlockTimestamp: endTime,
            validatorAddress: validatorAddress,
            validatorId: validatorId,
            vaultIndex: vaultIndex,
        });
    }
    for (const maturedVault of maturedVaults) {
        const vaultAddress = maturedVault.address;
        const validatorId = await client.readContract({
            abi: SftmxVault,
            address: vaultAddress,
            functionName: 'toValidatorID',
        });
        const validatorAddress = await client.readContract({
            abi: SftmxVault,
            address: vaultAddress,
            functionName: 'toValidator',
        });

        const [lockedStake, fromEpoch, endTime, duration] = await client.readContract({
            abi: SFC,
            address: SFC_ADDRESS,
            functionName: 'getLockupInfo',
            args: [vaultAddress, validatorId],
        });
        stakingData.vaults.push({
            id: vaultAddress,
            ftmStaked: lockedStake,
            ftmStakingId: stakingContractAddress,
            matured: true,
            unlockTimestamp: endTime,
            validatorAddress: validatorAddress,
            validatorId: validatorId,
            vaultIndex: maturedVault.index,
        });
    }
    return stakingData;
}
