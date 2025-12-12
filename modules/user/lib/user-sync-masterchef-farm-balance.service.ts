import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber } from 'ethers';
import _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { AmountHumanReadable } from '../../common/global-types';
import {
    FarmUserFragment,
    OrderDirection,
    User_OrderBy,
} from '../../subgraphs/masterchef-subgraph/generated/masterchef-subgraph-types';
import { getContractAtForNetwork } from '../../web3/contract';
import { Multicaller } from '../../web3/multicaller';
import { BeethovenxMasterChef } from '../../web3/types/BeethovenxMasterChef';
import MasterChefAbi from '../../web3/abi/MasterChef.json';
import { UserStakedBalanceService } from '../user-types';
import { PrismaPoolStakingType } from '@prisma/client';
import { BALANCES_SYNC_BLOCKS_MARGIN } from '../../../config';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';
import { getViemClient } from '../../sources/viem-client';

export class UserSyncMasterchefFarmBalanceService implements UserStakedBalanceService {
    constructor(private readonly masterchefAddress: string, private readonly excludedFarmIds: string[]) {}

    public async syncChangedStakedBalances(): Promise<void> {
        const chain = 'FANTOM';
        const networkconfig = AllNetworkConfigsKeyedOnChain[chain];

        const status = await prisma.prismaUserBalanceSyncStatus.findUnique({
            where: { type_chain: { type: 'STAKED', chain } },
        });

        if (!status) {
            throw new Error('UserMasterchefFarmBalanceService: syncStakedBalances called before initStakedBalances');
        }

        const pools = await prisma.prismaPool.findMany({
            where: {
                OR: [
                    { staking: { some: { type: 'FRESH_BEETS' } }, chain },
                    { staking: { some: { type: 'MASTER_CHEF' } }, chain },
                ],
            },
            include: { staking: true },
        });
        const viemClient = getViemClient(chain);
        const latestBlock = (await viemClient.getBlockNumber()).toString();

        const startBlock = status.blockNumber - BALANCES_SYNC_BLOCKS_MARGIN;
        const endBlock =
            parseFloat(latestBlock) - startBlock > networkconfig.data.rpcMaxBlockRange
                ? startBlock + networkconfig.data.rpcMaxBlockRange
                : parseFloat(latestBlock);

        // no new blocks have been minted, needed for slow networks
        if (startBlock > endBlock) {
            return;
        }

        const amountUpdates = await this.getAmountsForUsersWithBalanceChangesSinceStartBlock(
            this.masterchefAddress,
            startBlock,
            endBlock,
        );
        const userAddresses = _.uniq(amountUpdates.map((update) => update.userAddress));

        if (amountUpdates.length === 0) {
            await prisma.prismaUserBalanceSyncStatus.update({
                where: { type_chain: { type: 'STAKED', chain } },
                data: { blockNumber: endBlock },
            });

            return;
        }

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: userAddresses.map((userAddress) => ({ address: userAddress })),
                    skipDuplicates: true,
                }),
                ...amountUpdates.map((update) => {
                    if (update.amount === '0') {
                        return prisma.prismaUserStakedBalance.deleteMany({
                            where: {
                                id: `${update.farmId}-${update.userAddress}`,
                                chain,
                            },
                        });
                    } else {
                        return prisma.prismaUserStakedBalance.update({
                            where: {
                                id_chain: { id: `${update.farmId}-${update.userAddress}`, chain },
                            },
                            data: {
                                balance: update.amount,
                                balanceNum: parseFloat(update.amount),
                            },
                        });
                    }
                }),
                prisma.prismaUserBalanceSyncStatus.update({
                    where: { type_chain: { type: 'STAKED', chain } },
                    data: { blockNumber: endBlock },
                }),
            ],
            true,
        );
    }

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        return;
    }

    private async getAmountsForUsersWithBalanceChangesSinceStartBlock(
        masterChefAddress: string,
        startBlock: number,
        endBlock: number,
    ): Promise<{ farmId: string; userAddress: string; amount: AmountHumanReadable }[]> {
        const chain = 'FANTOM';
        const networkConfig = AllNetworkConfigsKeyedOnChain[chain];

        const contract: BeethovenxMasterChef = getContractAtForNetwork(
            masterChefAddress,
            MasterChefAbi,
            networkConfig.provider,
        );
        const events = await contract.queryFilter({ address: masterChefAddress }, startBlock, endBlock);
        const filteredEvents = events.filter((event) =>
            ['Deposit', 'Withdraw', 'EmergencyWithdraw'].includes(event.event!),
        );

        const multicall = new Multicaller(networkConfig.data.multicall, networkConfig.provider, MasterChefAbi);
        let response: {
            [farmId: string]: { [userAddress: string]: [BigNumber, BigNumber] };
        } = {};

        for (const event of filteredEvents) {
            multicall.call(`${event.args?.pid}.${event.args?.user}`, masterChefAddress, 'userInfo', [
                event.args?.pid,
                event.args?.user,
            ]);

            if (event.args?.user !== event.args?.to) {
                //need to also update the amount for the to address
                multicall.call(`${event.args?.pid}.${event.args?.to}`, masterChefAddress, 'userInfo', [
                    event.args?.pid,
                    event.args?.to,
                ]);
            }

            if (multicall.numCalls >= 100) {
                response = _.merge(response, await multicall.execute());
            }
        }

        if (multicall.numCalls > 0) {
            response = _.merge(response, await multicall.execute());
        }

        return _.map(response, (farmData, farmId) => {
            return _.map(farmData, ([amount], userAddress) => ({
                farmId,
                userAddress: userAddress.toLowerCase(),
                amount: formatFixed(amount, 18),
            }));
        })
            .flat()
            .filter((item) => !this.excludedFarmIds.includes(item.farmId));
    }
}
