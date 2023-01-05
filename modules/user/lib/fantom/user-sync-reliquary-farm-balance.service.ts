import { isSameAddress } from '@balancer-labs/sdk';
import { formatFixed } from '@ethersproject/bignumber';
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants';
import { PrismaPoolStakingType } from '@prisma/client';
import { BigNumber, Event } from 'ethers';
import _ from 'lodash';
import { prisma } from '../../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { bn } from '../../../big-number/big-number';
import { AmountHumanReadable } from '../../../common/global-types';
import { networkConfig } from '../../../config/network-config';
import {
    OrderDirection,
    Relic_OrderBy,
    ReliquaryRelicFragment,
} from '../../../subgraphs/reliquary-subgraph/generated/reliquary-subgraph-types';
import { reliquarySubgraphService } from '../../../subgraphs/reliquary-subgraph/reliquary.service';
import ReliquaryAbi from '../../../web3/abi/Reliquary.json';
import { getContractAt, jsonRpcProvider } from '../../../web3/contract';
import { Multicaller } from '../../../web3/multicaller';
import { Reliquary } from '../../../web3/types/Reliquary';
import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../../user-types';

type ReliquaryPosition = {
    amount: BigNumber;
    rewardDebt: BigNumber;
    rewardCredit: BigNumber;
    entry: BigNumber;
    poolId: BigNumber;
    level: BigNumber;
};

type BalanceChangedEvent = Event & {
    args: {
        pid: BigNumber;
        amount: BigNumber;
        to: string;
        relicId: BigNumber;
    };
};

type RelicManagementEvent = Event & {
    args: {
        fromId: BigNumber;
        toId: string;
        amount: BigNumber;
    };
};

type TransferEvent = Event & {
    args: {
        from: string;
        to: string;
        tokenId: BigNumber;
    };
};

export class UserSyncReliquaryFarmBalanceService implements UserStakedBalanceService {
    constructor(private readonly reliquaryAddress: string) {}

    public async syncChangedStakedBalances(): Promise<void> {
        const status = await prisma.prismaUserBalanceSyncStatus.findUnique({ where: { type: 'RELIQUARY' } });

        if (!status) {
            throw new Error('UserReliquaryFarmBalanceService: syncStakedBalances called before initStakedBalances');
        }

        const pools = await prisma.prismaPool.findMany({
            where: {
                staking: {
                    type: 'RELIQUARY',
                },
            },
            include: { staking: true },
        });
        const latestBlock = await jsonRpcProvider.getBlockNumber();
        const farms = await reliquarySubgraphService.getAllFarms({});

        const startBlock = status.blockNumber + 1;
        const endBlock = latestBlock - startBlock > 10_000 ? startBlock + 10_000 : latestBlock;
        const amountUpdates = await this.getAmountsForUsersWithBalanceChangesSinceStartBlock(
            this.reliquaryAddress,
            startBlock,
            endBlock,
        );
        const userAddresses = _.uniq(amountUpdates.map((update) => update.userAddress.toLowerCase()));

        if (amountUpdates.length === 0) {
            await prisma.prismaUserBalanceSyncStatus.update({
                where: { type: 'RELIQUARY' },
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
                    const userAddress = update.userAddress.toLowerCase();
                    const pool = pools.find((pool) => pool.staking?.id === `reliquary-${update.farmId}`);
                    const farm = farms.find((farm) => farm.pid.toString() === update.farmId);

                    return prisma.prismaUserStakedBalance.upsert({
                        where: { id: `reliquary-${update.farmId}-${userAddress}` },
                        update: {
                            balance: update.amount,
                            balanceNum: parseFloat(update.amount),
                            stakingId: `reliquary-${update.farmId}`,
                        },
                        create: {
                            id: `reliquary-${update.farmId}-${userAddress}`,
                            balance: update.amount,
                            balanceNum: parseFloat(update.amount),
                            userAddress: userAddress,
                            poolId: pool!.id,
                            tokenAddress: farm!.poolTokenAddress,
                            stakingId: `reliquary-${update.farmId}`,
                        },
                    });
                }),
                prisma.prismaUserBalanceSyncStatus.update({
                    where: { type: 'RELIQUARY' },
                    data: { blockNumber: endBlock },
                }),
            ],
            true,
        );
    }

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (!stakingTypes.includes('RELIQUARY')) {
            return;
        }
        const { block } = await reliquarySubgraphService.getMetadata();
        console.log('initStakedReliquaryBalances: loading subgraph relics...');
        const relics = await this.loadAllSubgraphRelics();
        console.log('initStakedReliquaryBalances: finished loading subgraph relics...');
        console.log('initStakedReliquaryBalances: loading pools...');
        const pools = await prisma.prismaPool.findMany({ select: { id: true, address: true } });
        console.log('initStakedReliquaryBalances: finished loading pools...');
        // we have to group all relics for the same pool
        const userRelicsByPoolId = _.groupBy(relics, (relic) => relic.userAddress + relic.pid);

        // we need to make sure all users exist
        const userAddresses = _.uniq(relics.map((relic) => relic.userAddress.toLowerCase()));

        console.log('initStakedReliquaryBalances: performing db operations...');

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: userAddresses.map((userAddress) => ({ address: userAddress })),
                    skipDuplicates: true,
                }),
                prisma.prismaUserStakedBalance.deleteMany({ where: { staking: { type: 'RELIQUARY' } } }),

                prisma.prismaUserStakedBalance.createMany({
                    data: Object.values(userRelicsByPoolId).map((relics) => {
                        const totalBalance = relics.reduce((total, relic) => total + parseFloat(relic.balance), 0);
                        // there has to be at least 1 relic in there
                        const relic = relics[0];
                        const userAddress = relic.userAddress.toLowerCase();
                        const pool = pools.find((pool) => isSameAddress(pool.address, relic.pool.poolTokenAddress));

                        return {
                            id: `reliquary-${relic.pid}-${userAddress}`,
                            balance: totalBalance.toString(),
                            balanceNum: totalBalance,
                            userAddress: userAddress,
                            poolId: pool?.id,
                            tokenAddress: relic.pool.poolTokenAddress,
                            stakingId: `reliquary-${relic.pid}`,
                        };
                    }),
                }),
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type: 'RELIQUARY' },
                    create: { type: 'RELIQUARY', blockNumber: block.number },
                    update: { blockNumber: block.number },
                }),
            ],
            true,
        );

        console.log('initStakedReliquaryBalances: finished...');
    }

    public async syncUserBalance({ userAddress, poolId, poolAddress, staking }: UserSyncUserBalanceInput) {
        if (staking.type !== 'RELIQUARY') {
            return;
        }
        const reliquary: Reliquary = getContractAt(this.reliquaryAddress, ReliquaryAbi);
        const relicPositions = await reliquary.relicPositionsOfOwner(userAddress);

        const positions = relicPositions[1];

        const balance = positions
            .filter((position) => position.poolId.toString() === poolId)
            .reduce((total, position) => total.add(position.amount), bn(0));
        const balanceFormatted = formatFixed(balance, 18);

        await prisma.prismaUserStakedBalance.upsert({
            where: { id: `reliquary-${staking.id}-${userAddress.toLowerCase()}` },
            update: {
                balance: balanceFormatted,
                balanceNum: parseFloat(balanceFormatted),
            },
            create: {
                id: `reliquary-${staking.id}-${userAddress.toLowerCase()}`,
                balance: balanceFormatted,
                balanceNum: parseFloat(balanceFormatted),
                userAddress: userAddress.toLowerCase(),
                poolId: poolId,
                tokenAddress: poolAddress,
                stakingId: staking.id,
            },
        });
    }

    private async getAmountsForUsersWithBalanceChangesSinceStartBlock(
        reliquaryAddress: string,
        startBlock: number,
        endBlock: number,
    ): Promise<{ farmId: string; userAddress: string; amount: AmountHumanReadable }[]> {
        const contract: Reliquary = getContractAt(reliquaryAddress, ReliquaryAbi);

        const events = await contract.queryFilter({ address: reliquaryAddress }, startBlock, endBlock);
        const balanceChangedEvents = events.filter((event) =>
            ['Deposit', 'Withdraw', 'EmergencyWithdraw'].includes(event.event!),
        ) as BalanceChangedEvent[];
        const relicManagementEvents = events.filter((event) =>
            ['Split', 'Shift'].includes(event.event!),
        ) as RelicManagementEvent[];
        const transferEvents = events.filter((event) => event.event === 'Transfer') as TransferEvent[];

        const multicall = new Multicaller(networkConfig.multicall, jsonRpcProvider, ReliquaryAbi);

        // for the transfer events, we know which users are affected
        let affectedUsers = transferEvents.flatMap((event) => [event.args.from, event.args.to]);
        // for the other events, we need to find the owners of the affected relicIds
        const affectedRelicIds = [
            ...balanceChangedEvents.map((event) => event.args.relicId),
            ...relicManagementEvents.flatMap((event) => [event.args.fromId, event.args.toId]),
        ];

        affectedRelicIds.forEach((relicId, index) => {
            multicall.call(`users[${index}]`, reliquaryAddress, 'ownerOf', [relicId]);
        });
        let ownerResult: { users: string[] } = await multicall.execute();
        affectedUsers = _.uniq([...affectedUsers, ...(ownerResult.users ?? [])]).filter(
            (address) => !isSameAddress(ZERO_ADDRESS, address),
        );

        affectedUsers.forEach((userAddress) => {
            multicall.call(userAddress, reliquaryAddress, 'relicPositionsOfOwner', [userAddress]);
        });

        // we get a tuple with an array of relicIds and the corresponding positions array
        const updatedPositions: { [userAddress: string]: [BigNumber[], ReliquaryPosition[]] } =
            await multicall.execute();
        // for each user we have to sum up all balances of a specific farm, so we key on user + farmId
        const userFarmBalances: {
            [userFarm: string]: { userAddress: string; farmId: string; amount: BigNumber };
        } = {};

        // we only care for the user address and all positions, we can ignore the relicIds array
        Object.entries(updatedPositions).forEach(([userAddress, [relicIds, positions]]) => {
            positions.forEach((position) => {
                const key = `${userAddress}-${position.poolId}`;
                if (key in userFarmBalances) {
                    userFarmBalances[key].amount = userFarmBalances[key].amount.add(position.amount);
                } else {
                    userFarmBalances[key] = {
                        userAddress,
                        farmId: position.poolId.toString(),
                        amount: position.amount,
                    };
                }
            });
        });
        return Object.values(userFarmBalances).map((userFarmBalance) => ({
            ...userFarmBalance,
            amount: formatFixed(userFarmBalance.amount, 18),
        }));
    }

    private async loadAllSubgraphRelics(): Promise<ReliquaryRelicFragment[]> {
        const pageSize = 1000;
        const MAX_SKIP = 5000;
        let allRelics: ReliquaryRelicFragment[] = [];
        let latestRelicId = 0;
        let hasMore = true;
        let skip = 0;

        while (hasMore) {
            const { relics } = await reliquarySubgraphService.getRelics({
                where: { relicId_gt: latestRelicId, balance_gt: '0' },
                first: pageSize,
                skip,
                orderBy: Relic_OrderBy.EntryTimestamp,
                orderDirection: OrderDirection.Asc,
            });

            allRelics.push(...relics);
            hasMore = relics.length >= pageSize;

            skip += pageSize;

            if (skip > MAX_SKIP) {
                latestRelicId = relics[relics.length - 1].relicId;
                skip = 0;
            }
        }
        return allRelics;
    }
}
