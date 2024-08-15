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
import { getContractAt } from '../../web3/contract';
import { Multicaller } from '../../web3/multicaller';
import { BeethovenxMasterChef } from '../../web3/types/BeethovenxMasterChef';
import MasterChefAbi from '../../web3/abi/MasterChef.json';
import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../network/network-context.service';
import { MasterchefSubgraphService } from '../../subgraphs/masterchef-subgraph/masterchef.service';

export class UserSyncMasterchefFarmBalanceService implements UserStakedBalanceService {
    constructor(
        private readonly fbeetsAddress: string,
        private readonly fbeetsFarmId: string,
        private readonly masterchefAddress: string,
        private readonly excludedFarmIds: string[],
    ) {}

    get masterchefService() {
        return new MasterchefSubgraphService(networkContext.data.subgraphs.masterchef!);
    }

    public async syncChangedStakedBalances(): Promise<void> {
        const status = await prisma.prismaUserBalanceSyncStatus.findUnique({
            where: { type_chain: { type: 'STAKED', chain: networkContext.chain } },
        });

        if (!status) {
            throw new Error('UserMasterchefFarmBalanceService: syncStakedBalances called before initStakedBalances');
        }

        const pools = await prisma.prismaPool.findMany({
            where: {
                OR: [
                    { staking: { some: { type: 'FRESH_BEETS' } }, chain: networkContext.chain },
                    { staking: { some: { type: 'MASTER_CHEF' } }, chain: networkContext.chain },
                ],
            },
            include: { staking: true },
        });
        const latestBlock = await networkContext.provider.getBlockNumber();
        const farms = await this.masterchefService.getAllFarms({});

        const startBlock = status.blockNumber + 1;
        const endBlock =
            latestBlock - startBlock > networkContext.data.rpcMaxBlockRange
                ? startBlock + networkContext.data.rpcMaxBlockRange
                : latestBlock;

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
                where: { type_chain: { type: 'STAKED', chain: networkContext.chain } },
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
                    const pool = pools.find((pool) => pool.staking.some((stake) => stake.id === update.farmId));
                    const farm = farms.find((farm) => farm.id === update.farmId);

                    if (update.amount === '0') {
                        return prisma.prismaUserStakedBalance.deleteMany({
                            where: {
                                id: `${update.farmId}-${update.userAddress}`,
                                chain: networkContext.chain,
                            },
                        });
                    } else {
                        return prisma.prismaUserStakedBalance.upsert({
                            where: {
                                id_chain: { id: `${update.farmId}-${update.userAddress}`, chain: networkContext.chain },
                            },
                            update: {
                                balance: update.amount,
                                balanceNum: parseFloat(update.amount),
                            },
                            create: {
                                id: `${update.farmId}-${update.userAddress}`,
                                chain: networkContext.chain,
                                balance: update.amount,
                                balanceNum: parseFloat(update.amount),
                                userAddress: update.userAddress,
                                poolId: update.farmId !== this.fbeetsFarmId ? pool?.id : null,
                                tokenAddress: farm!.pair,
                                stakingId: update.farmId,
                            },
                        });
                    }
                }),
                prisma.prismaUserBalanceSyncStatus.update({
                    where: { type_chain: { type: 'STAKED', chain: networkContext.chain } },
                    data: { blockNumber: endBlock },
                }),
            ],
            true,
        );
    }

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (!stakingTypes.includes('MASTER_CHEF')) {
            return;
        }
        const { block } = await this.masterchefService.getMetadata();
        console.log('initStakedBalances: loading subgraph users...');
        const farmUsers = await this.loadAllSubgraphUsers();
        console.log('initStakedBalances: finished loading subgraph users...');
        console.log('initStakedBalances: loading pools...');
        const pools = await prisma.prismaPool.findMany({
            select: { id: true, address: true },
            where: { chain: networkContext.chain },
        });
        console.log('initStakedBalances: finished loading pools...');
        const userAddresses = _.uniq(farmUsers.map((farmUser) => farmUser.address));

        console.log('initStakedBalances: performing db operations...');

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: userAddresses.map((userAddress) => ({ address: userAddress })),
                    skipDuplicates: true,
                }),
                prisma.prismaUserStakedBalance.deleteMany({
                    where: { staking: { type: 'MASTER_CHEF' }, chain: networkContext.chain },
                }),
                prisma.prismaUserStakedBalance.deleteMany({
                    where: { staking: { type: 'FRESH_BEETS' }, chain: networkContext.chain },
                }),
                prisma.prismaUserStakedBalance.createMany({
                    data: farmUsers
                        .filter((farmUser) => !this.excludedFarmIds.includes(farmUser.pool!.id))
                        .map((farmUser) => {
                            const pool = pools.find((pool) => pool.address === farmUser.pool?.pair);

                            return {
                                id: farmUser.id,
                                chain: networkContext.chain,
                                balance: formatFixed(farmUser.amount, 18),
                                balanceNum: parseFloat(formatFixed(farmUser.amount, 18)),
                                userAddress: farmUser.address,
                                poolId: pool?.id,
                                tokenAddress: farmUser.pool!.pair,
                                stakingId: farmUser.pool!.id,
                            };
                        }),
                }),
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type_chain: { type: 'STAKED', chain: networkContext.chain } },
                    create: { type: 'STAKED', chain: networkContext.chain, blockNumber: block.number },
                    update: { blockNumber: block.number },
                }),
            ],
            true,
        );

        console.log('initStakedBalances: finished...');
    }

    public async syncUserBalance({ userAddress, poolId, poolAddress, staking }: UserSyncUserBalanceInput) {
        if (staking.type !== 'MASTER_CHEF' && staking.type !== 'FRESH_BEETS') {
            return;
        }
        const masterchef: BeethovenxMasterChef = getContractAt(this.masterchefAddress, MasterChefAbi);
        const userInfo = await masterchef.userInfo(staking.id, userAddress);
        const amountStaked = formatFixed(userInfo[0], 18);

        await prisma.prismaUserStakedBalance.upsert({
            where: { id_chain: { id: `${staking.id}-${userAddress}`, chain: networkContext.chain } },
            update: {
                balance: amountStaked,
                balanceNum: parseFloat(amountStaked),
            },
            create: {
                id: `${staking.id}-${userAddress}`,
                chain: networkContext.chain,
                balance: amountStaked,
                balanceNum: parseFloat(amountStaked),
                userAddress,
                poolId: staking.type !== 'FRESH_BEETS' ? poolId : null,
                tokenAddress: staking.type === 'FRESH_BEETS' ? this.fbeetsAddress : poolAddress,
                stakingId: staking.id,
            },
        });
    }

    private async getAmountsForUsersWithBalanceChangesSinceStartBlock(
        masterChefAddress: string,
        startBlock: number,
        endBlock: number,
    ): Promise<{ farmId: string; userAddress: string; amount: AmountHumanReadable }[]> {
        const contract: BeethovenxMasterChef = getContractAt(masterChefAddress, MasterChefAbi);
        const events = await contract.queryFilter({ address: masterChefAddress }, startBlock, endBlock);
        const filteredEvents = events.filter((event) =>
            ['Deposit', 'Withdraw', 'EmergencyWithdraw'].includes(event.event!),
        );

        const multicall = new Multicaller(networkContext.data.multicall, networkContext.provider, MasterChefAbi);
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

    private async loadAllSubgraphUsers(): Promise<FarmUserFragment[]> {
        const pageSize = 1000;
        const MAX_SKIP = 5000;
        let users: FarmUserFragment[] = [];
        let timestamp = '0';
        let hasMore = true;
        let skip = 0;

        while (hasMore) {
            const { farmUsers } = await this.masterchefService.getFarmUsers({
                where: { timestamp_gte: timestamp, amount_not: '0' },
                first: pageSize,
                skip,
                orderBy: User_OrderBy.Timestamp,
                orderDirection: OrderDirection.Asc,
            });

            users = [...users, ...farmUsers];
            hasMore = farmUsers.length >= pageSize;

            skip += pageSize;

            if (skip > MAX_SKIP) {
                timestamp = users[users.length - 1].timestamp;
                skip = 0;
            }
        }

        return _.uniqBy(users, (user) => user.id);
    }
}
