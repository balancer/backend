import { addressesMatch } from '../../web3/addresses';
import { formatFixed } from '@ethersproject/bignumber';
import { zeroAddress as ZERO_ADDRESS } from 'viem';
import { Chain, PrismaPoolStakingType } from '@prisma/client';
import { Event } from 'ethers';
import _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { AmountHumanReadable } from '../../common/global-types';
import ReliquaryAbi from '../../web3/abi/Reliquary';
import { UserStakedBalanceService } from '../user-types';
import { ReliquarySubgraphService } from '../../subgraphs/reliquary-subgraph/reliquary.service';
import { BALANCES_SYNC_BLOCKS_MARGIN } from '../../../config';
import { floatToExactString } from '../../common/numbers';
import config from '../../../config';
import { getEvents } from '../../web3/events';
import { getViemClient } from '../../sources/viem-client';
import { Multicaller3Viem } from '../../web3/multicaller-viem';

type ReliquaryPosition = {
    amount: bigint;
    rewardDebt: bigint;
    rewardCredit: bigint;
    entry: bigint;
    poolId: bigint;
    level: bigint;
};

type BalanceChangedEvent = Event & {
    args: {
        pid: bigint;
        amount: bigint;
        to: string;
        relicId: bigint;
    };
};

type RelicManagementEvent = Event & {
    args: {
        fromId: bigint;
        toId: string;
        amount: bigint;
    };
};

type TransferEvent = Event & {
    args: {
        from: string;
        to: string;
        tokenId: bigint;
    };
};

export class UserSyncReliquaryFarmBalanceService implements UserStakedBalanceService {
    constructor(private readonly reliquaryAddress: string) {}

    public async syncChangedStakedBalances(chain: Chain): Promise<void> {
        const networkData = config[chain];
        const reliquarySubgraphService = new ReliquarySubgraphService(networkData.subgraphs.reliquary!);
        const viemClient = getViemClient(chain);

        const status = await prisma.prismaUserBalanceSyncStatus.findUnique({
            where: { type_chain: { type: 'RELIQUARY', chain } },
        });

        if (!status) {
            throw new Error('UserReliquaryFarmBalanceService: syncStakedBalances called before initStakedBalances');
        }

        const pools = await prisma.prismaPool.findMany({
            where: {
                staking: {
                    some: {
                        type: 'RELIQUARY',
                    },
                },
                chain,
            },
            include: { staking: true },
        });
        const latestBlock = (await viemClient.getBlockNumber()).toString();
        const farms = await reliquarySubgraphService.getAllFarms({});
        const filteredFarms = farms.filter(
            (farm) => !networkData.reliquary!.excludedFarmIds.includes(farm.pid.toString()),
        );

        const startBlock = status.blockNumber - BALANCES_SYNC_BLOCKS_MARGIN;
        const endBlock =
            parseFloat(latestBlock) - startBlock > networkData.rpcMaxBlockRange
                ? startBlock + networkData.rpcMaxBlockRange
                : parseFloat(latestBlock);

        const amountUpdates = await this.getAmountsForUsersWithBalanceChangesSinceStartBlock(
            this.reliquaryAddress,
            startBlock,
            endBlock,
            chain,
        );

        // no new blocks have been minted, needed for slow networks
        if (startBlock > endBlock) {
            return;
        }
        const userAddresses = _.uniq(amountUpdates.map((update) => update.userAddress.toLowerCase()));

        const filteredAmountUpdates = amountUpdates.filter(
            (update) =>
                !networkData.reliquary!.excludedFarmIds.includes(update.farmId.toString()) &&
                update.amount !== '0.0',
        );

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: userAddresses.map((userAddress) => ({ address: userAddress })),
                    skipDuplicates: true,
                }),
                prisma.prismaUserStakedBalance.deleteMany({
                    where: {
                        staking: { type: 'RELIQUARY' },
                        chain,
                        userAddress: { in: userAddresses },
                    },
                }),
                ...filteredAmountUpdates.map((update) => {
                    const userAddress = update.userAddress.toLowerCase();
                    const pool = pools.find((pool) =>
                        pool.staking.some((stake) => stake.id === `reliquary-${update.farmId}`),
                    );
                    const farm = filteredFarms.find((farm) => farm.pid.toString() === update.farmId);

                    return prisma.prismaUserStakedBalance.upsert({
                        where: {
                            id_chain: {
                                id: `reliquary-${update.farmId}-${userAddress}`,
                                chain,
                            },
                        },
                        update: {
                            balance: floatToExactString(update.amount),
                            balanceNum: parseFloat(update.amount),
                            stakingId: `reliquary-${update.farmId}`,
                        },
                        create: {
                            id: `reliquary-${update.farmId}-${userAddress}`,
                            chain,
                            balance: floatToExactString(update.amount),
                            balanceNum: parseFloat(update.amount),
                            userAddress: userAddress,
                            poolId: pool!.id,
                            tokenAddress: farm!.poolTokenAddress,
                            stakingId: `reliquary-${update.farmId}`,
                        },
                    });
                }),
                prisma.prismaUserBalanceSyncStatus.update({
                    where: { type_chain: { type: 'RELIQUARY', chain } },
                    data: { blockNumber: endBlock },
                }),
            ],
            true,
        );
    }

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> {
        if (!stakingTypes.includes('RELIQUARY')) {
            return;
        }

        const networkData = config[chain];
        const reliquarySubgraphService = new ReliquarySubgraphService(networkData.subgraphs.reliquary!);

        const blockNumber = await reliquarySubgraphService.lastSyncedBlock();
        console.log('initStakedReliquaryBalances: loading subgraph relics...');
        const relics = await reliquarySubgraphService.getAllRelicsWithPaging({});
        const filteredRelics = relics.filter(
            (relic) => !networkData.reliquary?.excludedFarmIds.includes(`${relic.pid}`),
        );
        console.log('initStakedReliquaryBalances: finished loading subgraph relics...');
        console.log('initStakedReliquaryBalances: loading pools...');
        const pools = await prisma.prismaPool.findMany({
            select: { id: true, address: true },
            where: { chain },
        });
        console.log('initStakedReliquaryBalances: finished loading pools...');
        // we have to group all relics for the same pool
        const userRelicsByPoolId = _.groupBy(filteredRelics, (relic) => relic.userAddress + relic.pid);

        // we need to make sure all users exist
        const userAddresses = _.uniq(filteredRelics.map((relic) => relic.userAddress.toLowerCase()));

        console.log('initStakedReliquaryBalances: performing db operations...');

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: userAddresses.map((userAddress) => ({ address: userAddress })),
                    skipDuplicates: true,
                }),
                prisma.prismaUserStakedBalance.deleteMany({
                    where: { staking: { type: 'RELIQUARY' }, chain },
                }),

                prisma.prismaUserStakedBalance.createMany({
                    data: Object.values(userRelicsByPoolId).map((relics) => {
                        const totalBalance = relics.reduce((total, relic) => total + parseFloat(relic.balance), 0);
                        // there has to be at least 1 relic in there
                        const relic = relics[0];
                        const userAddress = relic.userAddress.toLowerCase();
                        const pool = pools.find((pool) => addressesMatch(pool.address, relic.pool.poolTokenAddress));

                        return {
                            id: `reliquary-${relic.pid}-${userAddress}`,
                            chain,
                            balance: totalBalance.toFixed(18).replace(/(?:\.0+|(\.\d*?)0+)$/, '$1'),
                            balanceNum: totalBalance,
                            userAddress: userAddress,
                            poolId: pool?.id,
                            tokenAddress: relic.pool.poolTokenAddress,
                            stakingId: `reliquary-${relic.pid}`,
                        };
                    }),
                }),
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type_chain: { type: 'RELIQUARY', chain } },
                    create: { type: 'RELIQUARY', chain, blockNumber },
                    update: { blockNumber },
                }),
            ],
            true,
        );

        console.log('initStakedReliquaryBalances: finished...');
    }

    private async getAmountsForUsersWithBalanceChangesSinceStartBlock(
        reliquaryAddress: string,
        startBlock: number,
        endBlock: number,
        chain: Chain,
    ): Promise<{ farmId: string; userAddress: string; amount: AmountHumanReadable }[]> {
        const networkData = config[chain];

        const viemEvents = await getEvents(
            startBlock,
            endBlock,
            [reliquaryAddress],
            ['Transfer', 'Deposit', 'Withdraw', 'EmergencyWithdraw', 'Shift'],
            networkData.rpcUrl,
            networkData.rpcMaxBlockRange,
            ReliquaryAbi,
        );

        const balanceChangedEvents = viemEvents.filter(
            (event) =>
                event.topics.length > 0 &&
                [
                    //deposit topic
                    '0x9a2a1e97e6d641080089aafc36750cfdef4c79f8b3ace6fa4c384fa2f0476959',
                    //withdraw topic
                    '0x191a58d19a6a9b76e2e91bdc04ecbe7553dc094a5ad7af78175a0d9f884e264a',
                    //emergency withdraw topic
                    '0x6aaee64d11e8979fa392cd6388058c820f43709933f6a297e6e1005dddca62d6',
                ].includes(event.topics[0]),
        ) as BalanceChangedEvent[];

        const relicManagementEvents = viemEvents.filter(
            (event) =>
                event.topics.length > 0 &&
                [
                    //shift topic needs to be inspected since we only now sender and the two relic ids, could be different receiving user
                    '0xda2a03409498a5fe8db3da030754afa618bc2228c0517ec5fa8c9b052979e9ea',
                ].includes(event.topics[0]),
        ) as RelicManagementEvent[];

        const transferEvents = viemEvents.filter((event) => event.event === 'Transfer') as TransferEvent[];

        const viemClient = getViemClient(chain);
        const multicall3 = new Multicaller3Viem(chain, ReliquaryAbi);

        // for the transfer events, we know which users are affected
        let affectedUsers = transferEvents.flatMap((event) => [event.args.from, event.args.to]);

        // for the other events, we need to find the owners of the affected relicIds
        const affectedRelicIds = [
            ...balanceChangedEvents.map((event) => parseInt(event.topics[3], 16)),
            ...relicManagementEvents.flatMap((event) => [parseInt(event.topics[1], 16), parseInt(event.topics[2], 16)]), //from relicId and to relicId
        ];
        //can already filter out relics we know that got burned
        const burnedRelics = transferEvents
            .filter((event) => event.args.to === ZERO_ADDRESS)
            .map((event) => event.args.tokenId.toString());
        const filteredAffectedRelicIds = affectedRelicIds.filter((relicId) => !burnedRelics.includes(`${relicId}`));

        // can't use multicall since relics could be burned in the meantime and ownerOf call reverts for burned relics
        const relicOwners: string[] = [];
        for (const relicId of filteredAffectedRelicIds) {
            try {
                const owner = await viemClient.readContract({
                    address: reliquaryAddress as `0x${string}`,
                    abi: ReliquaryAbi,
                    functionName: 'ownerOf',
                    args: [BigInt(relicId)],
                });
                relicOwners.push(owner);
            } catch (e) {
                console.log(`Could not get owner of relic. Skipping.`);
            }
        }
        affectedUsers = _.uniq([...affectedUsers, ...relicOwners]).filter(
            (address) => !addressesMatch(ZERO_ADDRESS, address),
        );

        affectedUsers.forEach((userAddress) => {
            multicall3.call(userAddress, reliquaryAddress, 'relicPositionsOfOwner', [userAddress]);
        });

        // we get a tuple with an array of relicIds and the corresponding positions array
        const updatedPositions: { [userAddress: string]: [bigint[], ReliquaryPosition[]] } = await multicall3.execute();
        // for each user we have to sum up all balances of a specific farm, so we key on user + farmId
        const userFarmBalances: {
            [userFarm: string]: { userAddress: string; farmId: string; amount: bigint };
        } = {};

        // we only care for the user address and all positions, we can ignore the relicIds array
        Object.entries(updatedPositions).forEach(([userAddress, [relicIds, positions]]) => {
            if (positions.length === 0) {
                userFarmBalances[userAddress] = {
                    userAddress,
                    farmId: '0',
                    amount: 0n,
                };
            }
            positions.forEach((position) => {
                const key = `${userAddress}-${position.poolId}`;
                if (key in userFarmBalances) {
                    userFarmBalances[key].amount = userFarmBalances[key].amount + position.amount;
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
}
