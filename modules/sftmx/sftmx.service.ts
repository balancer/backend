import { prisma } from '../../prisma/prisma-client';
import { GqlSftmxStakingData, GqlSftmxWithdrawalRequests } from '../../schema';
import { SftmxSubgraphService } from '../subgraphs/sftmx-subgraph/sftmx.service';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';
import { Multicaller3 } from '../web3/multicaller3';
import FTMStaking from './abi/FTMStaking.json';
import Vault from './abi/Vault.json';
import SFC from './abi/SFC.json';
import { BigNumber } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { getContractAt } from '../web3/contract';

export class SftmxService {
    private readonly SFC_ADDRESS = '0xFC00FACE00000000000000000000000000000000';

    constructor(
        private readonly sftmxSubgraphService: SftmxSubgraphService,
        private readonly stakingContractAddress: string,
    ) {}

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
        };
    }

    public async syncStakingData() {
        const multicaller = new Multicaller3(FTMStaking.abi);
        multicaller.call('currentVaultCount', this.stakingContractAddress, 'currentVaultCount');
        multicaller.call('currentVaultPtr', this.stakingContractAddress, 'currentVaultPtr');
        multicaller.call('poolBalance', this.stakingContractAddress, 'getPoolBalance');
        multicaller.call('totalFtm', this.stakingContractAddress, 'totalFTMWorth');
        multicaller.call('maxDeposit', this.stakingContractAddress, 'maxDeposit');
        multicaller.call('minDeposit', this.stakingContractAddress, 'minDeposit');
        multicaller.call('maintenancePaused', this.stakingContractAddress, 'maintenancePaused');
        multicaller.call('undelegatePaused', this.stakingContractAddress, 'undelegatePaused');
        multicaller.call('withdrawPaused', this.stakingContractAddress, 'withdrawPaused');
        multicaller.call('getExchangeRate', this.stakingContractAddress, 'getExchangeRate');
        multicaller.call('withdrawalDelay', this.stakingContractAddress, 'withdrawalDelay');

        const result = await multicaller.execute();

        const vaultCount = result['currentVaultCount'] as BigNumber;
        const vaultPtr = result['currentVaultPtr'] as BigNumber;
        const poolBalance = result['poolBalance'] as BigNumber;
        const totalFtm = result['totalFtm'] as BigNumber;
        const maxDeposit = result['maxDeposit'] as BigNumber;
        const minDeposit = result['minDeposit'] as BigNumber;
        const exchangeRate = result['getExchangeRate'] as BigNumber;
        const maintenancePaused = result['maintenancePaused'] as boolean;
        const undelegatePaused = result['undelegatePaused'] as boolean;
        const withdrawPaused = result['withdrawPaused'] as boolean;
        const withdrawalDelay = result['withdrawalDelay'] as BigNumber;

        const stakingApr = await this.getStakingApr();

        const vaultCountNumber = parseFloat(vaultCount.toString());
        const vaultPtrNumber = parseFloat(vaultPtr.toString());

        const stakingData = {
            id: this.stakingContractAddress,
            totalFtmStaked: formatFixed(totalFtm.sub(poolBalance).toString(), 18),
            totalFtmInPool: formatFixed(poolBalance.toString(), 18),
            numberOfVaults: vaultCountNumber,
            totalFtm: formatFixed(totalFtm.toString(), 18),
            maxDepositLimit: formatFixed(maxDeposit.toString(), 18),
            minDepositLimit: formatFixed(minDeposit.toString(), 18),
            maintenancePaused: maintenancePaused,
            undelegatePaused: undelegatePaused,
            withdrawPaused: withdrawPaused,
            stakingApr: stakingApr,
            exchangeRate: formatFixed(exchangeRate.toString(), 18),
            withdrawalDelay: parseFloat(withdrawalDelay.toString()),
        };

        await prisma.prismaSftmxStakingData.upsert({
            where: { id: this.stakingContractAddress },
            create: stakingData,
            update: stakingData,
        });

        const ftmStakingContract = getContractAt(this.stakingContractAddress, FTMStaking.abi);

        const operations = [];

        for (let i = 1; i <= vaultCountNumber; i++) {
            const vaultIndex = vaultPtrNumber - i;
            const vaultAddress = await ftmStakingContract.getVault(vaultIndex);
            const vaultContract = getContractAt(vaultAddress, Vault.abi);
            const validatorId = await vaultContract.toValidatorID();
            const validatorAddress = await vaultContract.toValidator();
            const sfcContract = getContractAt(this.SFC_ADDRESS, SFC.abi);

            const [lockedStake, fromEpoch, endTime, duration] = await sfcContract.getLockupInfo(
                vaultAddress,
                validatorId,
            );
            const vaultData = {
                id: vaultAddress,
                ftmStaked: formatFixed(lockedStake, 18),
                ftmStakingId: this.stakingContractAddress,
                matured: false,
                unlockTimestamp: parseFloat(endTime.toString()),
                validatorAddress: validatorAddress,
                validatorId: validatorId.toString(),
                vaultIndex: vaultIndex,
            };
            operations.push(
                prisma.prismaSftmxVault.upsert({
                    where: { id: vaultData.id },
                    create: vaultData,
                    update: vaultData,
                }),
            );
        }

        const maturedVaultCount = await ftmStakingContract.getMaturedVaultLength();

        for (let i = 0; i < maturedVaultCount; i++) {
            const maturedVaultAddress = await ftmStakingContract.getMaturedVault(i);
            operations.push(
                prisma.prismaSftmxVault.update({
                    where: { id: maturedVaultAddress },
                    data: {
                        matured: true,
                    },
                }),
            );
        }

        await prismaBulkExecuteOperations(operations);
    }

    public async syncWithdrawalRequests() {
        const allWithdrawalRequests = await this.sftmxSubgraphService.getAllWithdrawawlRequestsWithPaging();

        const operations = [];
        for (const request of allWithdrawalRequests) {
            const requestData = {
                id: request.id,
                ftmStakingId: this.stakingContractAddress,
                user: request.user.id,
                amountSftmx: request.amount,
                isWithdrawn: request.isWithdrawn,
                requestTimestamp: request.requestTime,
            };
            operations.push(
                prisma.prismaSftmxWithdrawalRequest.upsert({
                    where: { id: requestData.id },
                    create: requestData,
                    update: requestData,
                }),
            );
        }
        await prismaBulkExecuteOperations(operations);
    }

    private async getStakingApr(): Promise<string> {
        const baseApr = 0.018;
        const maxLockApr = 0.06;
        const validatorFee = 0.15;
        const sftmxFee = 0.1;
        const ftmStakingContract = getContractAt(this.stakingContractAddress, FTMStaking.abi);

        const totalFtm = (await ftmStakingContract.totalFTMWorth()) as BigNumber;
        const poolFtm = (await ftmStakingContract.getPoolBalance()) as BigNumber;
        const maturedVaultCount = await ftmStakingContract.getMaturedVaultLength();

        let maturedFtmAmount = BigNumber.from('0');

        for (let i = 0; i < maturedVaultCount; i++) {
            const vaultAddress = await ftmStakingContract.getMaturedVault(i);
            const vaultContract = getContractAt(vaultAddress, Vault.abi);
            const vaultAmount = await vaultContract.currentStakeValue();
            maturedFtmAmount = maturedFtmAmount.add(vaultAmount);
        }

        const totalFtmNum = parseFloat(formatFixed(totalFtm.toString(), 18));
        const poolFtmNum = parseFloat(formatFixed(poolFtm.toString(), 18));
        const maturedFtmNum = parseFloat(formatFixed(maturedFtmAmount.toString(), 18));
        const stakedFtmNum = totalFtmNum - poolFtmNum - maturedFtmNum;

        const totalMaxLockApr = (stakedFtmNum / totalFtmNum) * (maxLockApr * (1 - validatorFee)) * (1 - sftmxFee);
        const totalBaseApr = (maturedFtmNum / totalFtmNum) * (baseApr * (1 - validatorFee)) * (1 - sftmxFee);

        return `${totalMaxLockApr + totalBaseApr}`;
    }
}

export const sftmxService = new SftmxService(
    AllNetworkConfigsKeyedOnChain['FANTOM'].services.sftmxSubgraphService!,
    AllNetworkConfigsKeyedOnChain['FANTOM'].data.sftmx!.stakingContractAddress,
);
