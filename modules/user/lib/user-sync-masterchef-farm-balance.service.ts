import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber } from 'ethers';
import _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { AmountHumanReadable } from '../../common/global-types';
import MasterChefAbi from '../../web3/abi/MasterChef.json';
import { UserStakedBalanceService } from '../user-types';
import { PrismaPoolStakingType } from '@prisma/client';
import { BALANCES_SYNC_BLOCKS_MARGIN } from '../../../config';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';
import { getViemClient } from '../../sources/viem-client';
import { getEvents } from '../../web3/events';
import { Multicaller3Viem } from '../../web3/multicaller-viem';

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

        let response: {
            [farmId: string]: { [userAddress: string]: [BigNumber, BigNumber] };
        } = {};

        const viemEvents = await getEvents(
            startBlock,
            endBlock,
            [masterChefAddress],
            ['Deposit', 'Withdraw', 'EmergencyWithdraw'],
            networkConfig.data.rpcUrl,
            networkConfig.data.rpcMaxBlockRange,
            MasterChefAbi,
        );

        const multicall3 = new Multicaller3Viem(chain, MasterChefAbi);

        for (const event of viemEvents) {
            multicall3.call(`${event.args?.pid}.${event.args?.user}`, masterChefAddress, 'userInfo', [
                event.args?.pid,
                event.args?.user,
            ]);

            if (event.args?.user !== event.args?.to) {
                //need to also update the amount for the to address
                multicall3.call(`${event.args?.pid}.${event.args?.to}`, masterChefAddress, 'userInfo', [
                    event.args?.pid,
                    event.args?.to,
                ]);
            }

            if (multicall3.numCalls >= 100) {
                response = _.merge(response, await multicall3.execute());
            }
        }

        if (multicall3.numCalls > 0) {
            response = _.merge(response, await multicall3.execute());
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
