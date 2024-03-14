import { Address, formatEther } from 'viem';
import FTMStaking from './abis/FTMStaking';
import SftmxVault from './abis/SftmxVault';
import SFC from './abis/SFC';
import { ViemClient } from '../types';

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

    const results = await client.multicall({
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
    });

    if (results.some((result) => result.status === 'failure')) {
        throw Error('Sftmx staking data multicall failed.');
    }

    const currentVaultCount = results[0].result as bigint;
    const currentVaultPtr = results[1].result as bigint;
    const poolBalance = results[2].result as bigint;
    const totalFtm = results[3].result as bigint;
    const maxDeposit = results[4].result as bigint;
    const minDeposit = results[5].result as bigint;
    const maintenancePaused = results[6].result as boolean;
    const undelegatePaused = results[7].result as boolean;
    const withdrawPaused = results[8].result as boolean;
    const exchangeRate = results[9].result as bigint;
    const withdrawalDelay = results[10].result as bigint;

    const totalFtmStaked = totalFtm - poolBalance;

    const maxLockApr = 0.06;
    const validatorFee = 0.15;
    const sftmxFee = 0.1;
    const stakingApr =
        (parseFloat(formatEther(totalFtm)) / parseFloat(formatEther(totalFtm))) *
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

    const maturedVaults: Address[] = [];

    for (let i = 0n; i < maturedVaultCount; i++) {
        const maturedVaultAddress = await client.readContract({
            abi: FTMStaking,
            address: stakingContractAddress,
            functionName: 'getMaturedVault',
            args: [i],
        });
        maturedVaults.push(maturedVaultAddress);
    }

    for (let i = 1n; i <= stakingData.numberOfVaults; i++) {
        const vaultIndex = currentVaultPtr - i;
        const vaultAddress = await client.readContract({
            abi: FTMStaking,
            address: stakingContractAddress,
            functionName: 'getVault',
            args: [vaultIndex],
        });
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
            matured: maturedVaults.includes(vaultAddress),
            unlockTimestamp: endTime,
            validatorAddress: validatorAddress,
            validatorId: validatorId,
            vaultIndex: vaultIndex,
        });
    }
    return stakingData;
}
