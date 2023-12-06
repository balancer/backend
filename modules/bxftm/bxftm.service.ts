import { prisma } from '../../prisma/prisma-client';
import { GqlBxFtmStakingData, GqlBxFtmWithdrawalRequests, QueryBxftmGetWithdrawalRequestsArgs } from '../../schema';
import { BxftmSubgraphService } from '../subgraphs/bxftm-subgraph/bxftm.service';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';
import { networkContext } from '../network/network-context.service';
import { Multicaller3 } from '../web3/multicaller3';
import FTMStaking from './abi/FTMStaking.json';
import Vault from './abi/Vault.json';
import { BigNumber } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { getContractAt } from '../web3/contract';

export class BxFtmService {
    constructor(
        private readonly bxFtmSubgraphService: BxftmSubgraphService,
        private readonly stakingContractAddress: string,
    ) {}

    public async getWithdrawalRequests(user: string): Promise<GqlBxFtmWithdrawalRequests[]> {
        const balances = await prisma.prismaBxFtmWithdrawalRequest.findMany({
            where: {
                user: user,
            },
        });
        return balances;
    }

    public async getStakingData(): Promise<GqlBxFtmStakingData> {
        const stakingData = await prisma.prismaBxFtmStakingData.findUniqueOrThrow({
            where: { id: this.stakingContractAddress },
        });
        return {
            totalAmountInPool: stakingData.totalFtmInPool,
            numberOfVaults: stakingData.numberOfVaults,
            totalAmountStaked: stakingData.totalFtmStaked,
            totalAmount: stakingData.totalFtm,
            maxDepositLimit: stakingData.maxDepositLimit,
            minDepositLimit: stakingData.minDepositLimit,
            maintenancePaused: stakingData.maintenancePaused,
            undelegatePaused: stakingData.undelegatePaused,
            withdrawPaused: stakingData.withdrawPaused,
            apr: stakingData.apr,
        };
    }

    public async syncStakingData() {
        const multicaller = new Multicaller3(FTMStaking.abi);
        multicaller.call('currentVaultCount', this.stakingContractAddress, 'currentVaultCount');
        multicaller.call('poolBalance', this.stakingContractAddress, 'getPoolBalance');
        multicaller.call('totalFtm', this.stakingContractAddress, 'totalFTMWorth');
        multicaller.call('maxDeposit', this.stakingContractAddress, 'maxDeposit');
        multicaller.call('minDeposit', this.stakingContractAddress, 'minDeposit');
        multicaller.call('maintenancePaused', this.stakingContractAddress, 'maintenancePaused');
        multicaller.call('undelegatePaused', this.stakingContractAddress, 'undelegatePaused');
        multicaller.call('withdrawPaused', this.stakingContractAddress, 'withdrawPaused');

        const result = await multicaller.execute();

        const vaultCount = result['currentVaultCount'] as BigNumber;
        const poolBalance = result['poolBalance'] as BigNumber;
        const totalFtm = result['totalFtm'] as BigNumber;
        const maxDeposit = result['maxDeposit'] as BigNumber;
        const minDeposit = result['minDeposit'] as BigNumber;
        const maintenancePaused = result['maintenancePaused'] as boolean;
        const undelegatePaused = result['undelegatePaused'] as boolean;
        const withdrawPaused = result['withdrawPaused'] as boolean;

        const apr = await this.getStakingApr();

        const stakingData = {
            id: this.stakingContractAddress,
            totalFtmStaked: formatFixed(totalFtm.sub(poolBalance).toString(), 18),
            totalFtmInPool: formatFixed(poolBalance.toString(), 18),
            numberOfVaults: parseFloat(vaultCount.toString()),
            totalFtm: formatFixed(totalFtm.toString(), 18),
            maxDepositLimit: formatFixed(maxDeposit.toString(), 18),
            minDepositLimit: formatFixed(minDeposit.toString(), 18),
            maintenancePaused: maintenancePaused,
            undelegatePaused: undelegatePaused,
            withdrawPaused: withdrawPaused,
            apr: apr,
        };

        await prisma.prismaBxFtmStakingData.upsert({
            where: { id: this.stakingContractAddress },
            create: stakingData,
            update: stakingData,
        });
    }

    public async syncWithdrawalRequests() {
        const allWithdrawalRequests = await this.bxFtmSubgraphService.getAllWithdrawawlRequestsWithPaging();

        const operations = [];
        for (const request of allWithdrawalRequests) {
            const requestData = {
                id: request.id,
                user: request.user.id,
                amount: request.amount,
                isWithdrawn: request.isWithdrawn,
                requestTimestamp: request.requestTime,
            };
            operations.push(
                prisma.prismaBxFtmWithdrawalRequest.upsert({
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
        const bxFtmFee = 0.1;
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

        const totalMaxLockApr = (stakedFtmNum / totalFtmNum) * (maxLockApr * (1 - validatorFee)) * (1 - bxFtmFee);
        const totalBaseApr = (maturedFtmNum / totalFtmNum) * (baseApr * (1 - validatorFee)) * (1 - bxFtmFee);

        return `${totalMaxLockApr + totalBaseApr}`;
    }
}

export const bxFtmService = new BxFtmService(
    AllNetworkConfigsKeyedOnChain['FANTOM'].services.bxFtmSubgraphService!,
    AllNetworkConfigsKeyedOnChain['FANTOM'].data.bxFtm!.stakingContractAddress,
);
