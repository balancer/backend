import { prisma } from '../../prisma/prisma-client';
import { GqlBxFtmStakingData, GqlBxFtmWithdrawalRequests, QueryBxftmGetWithdrawalRequestsArgs } from '../../schema';
import { BxftmSubgraphService } from '../subgraphs/bxftm-subgraph/bxftm.service';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';
import { networkContext } from '../network/network-context.service';
import { Multicaller3 } from '../web3/multicaller3';
import FTMStaking from './abi/FTMStaking.json';
import { BigNumber, ethers } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { vault } from 'googleapis/build/src/apis/vault';

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
        };
    }

    public async syncStakingData() {
        const multicaller = new Multicaller3(FTMStaking.abi);
        multicaller.call('currentVaultCount', this.stakingContractAddress, 'currentVaultCount');
        multicaller.call('poolBalance', this.stakingContractAddress, 'getPoolBalance');
        multicaller.call('totalFtm', this.stakingContractAddress, 'totalFTMWorth');

        const result = await multicaller.execute();

        const vaultCount = result['currentVaultCount'] as BigNumber;
        const poolBalance = result['poolBalance'] as BigNumber;
        const totalFtm = result['totalFtm'] as BigNumber;

        const stakingData = {
            id: this.stakingContractAddress,
            totalFtmStaked: formatFixed(totalFtm.sub(poolBalance).toString(), 18),
            totalFtmInPool: formatFixed(poolBalance.toString(), 18),
            numberOfVaults: parseFloat(vaultCount.toString()),
            totalFtm: formatFixed(totalFtm.toString(), 18),
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
}

export const bxFtmService = new BxFtmService(
    AllNetworkConfigsKeyedOnChain['FANTOM'].services.bxFtmSubgraphService!,
    AllNetworkConfigsKeyedOnChain['FANTOM'].data.bxFtm!.stakingContractAddress,
);
