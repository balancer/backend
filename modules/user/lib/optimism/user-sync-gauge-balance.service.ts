import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../../user-types';
import { prisma } from '../../../../prisma/prisma-client';
import { getContractAt } from '../../../web3/contract';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../../prisma/prisma-util';
import { gaugeSerivce, GaugeShare } from '../../../pool/lib/staking/optimism/gauge-service';
import RewardsOnlyGaugeAbi from './abi/RewardsOnlyGauge.json';
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants';
import { Multicaller } from '../../../web3/multicaller';
import { BigNumber } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../../network/network-context.service';

export class UserSyncGaugeBalanceService implements UserStakedBalanceService {
    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (!stakingTypes.includes('GAUGE')) {
            return;
        }
        const { block } = await gaugeSerivce.getMetadata();
        console.log('initStakedBalances: loading subgraph users...');
        const gaugeShares = await gaugeSerivce.getAllGaugeShares();
        console.log('initStakedBalances: finished loading subgraph users...');
        console.log('initStakedBalances: loading pools...');
        const pools = await prisma.prismaPool.findMany({
            select: { id: true },
            where: { chain: networkContext.chain },
        });
        console.log('initStakedBalances: finished loading pools...');
        const userAddresses = _.uniq(gaugeShares.map((share) => share.user.id));

        console.log('initStakedBalances: performing db operations...');

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: userAddresses.map((userAddress) => ({ address: userAddress })),
                    skipDuplicates: true,
                }),
                prisma.prismaUserStakedBalance.deleteMany({ where: { chain: networkContext.chain } }),
                prisma.prismaUserStakedBalance.createMany({
                    data: gaugeShares.map((share) => {
                        const pool = pools.find((pool) => pool.id === share.gauge.poolId);

                        return {
                            id: `${share.gauge.id}-${share.user.id}`,
                            chain: networkContext.chain,
                            balance: share.balance,
                            balanceNum: parseFloat(share.balance),
                            userAddress: share.user.id,
                            poolId: pool?.id,
                            tokenAddress: share.gauge.poolAddress,
                            stakingId: share.gauge.id,
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

    public async syncChangedStakedBalances(): Promise<void> {
        // we always store the latest synced block
        const status = await prisma.prismaUserBalanceSyncStatus.findUnique({
            where: { type_chain: { type: 'STAKED', chain: networkContext.chain } },
        });

        if (!status) {
            throw new Error('UserSyncGaugeBalanceService: syncStakedBalances called before initStakedBalances');
        }

        const pools = await prisma.prismaPool.findMany({
            include: { staking: true },
            where: { chain: networkContext.chain },
        });
        const latestBlock = await networkContext.provider.getBlockNumber();
        const gaugeAddresses = await gaugeSerivce.getAllGaugeAddresses();

        // we sync at most 10k blocks at a time
        const startBlock = status.blockNumber + 1;
        const endBlock =
            latestBlock - startBlock > networkContext.data.rpcMaxBlockRange
                ? startBlock + networkContext.data.rpcMaxBlockRange
                : latestBlock;

        const multicall = new Multicaller(networkContext.data.multicall, networkContext.provider, RewardsOnlyGaugeAbi);

        // the multicall response will be merged into this object
        let response: {
            [gauge: string]: { [userAddress: string]: BigNumber };
        } = {};

        // we keep track of all user addresses to create them as entities in the db
        const allUserAddress: string[] = [];

        /*
            we need to figure out which users have a changed balance on any gauge contract and update their balance,
            therefore we check all deposit, withdraw and transfer events since the last synced block
         */
        for (let gaugeAddress of gaugeAddresses) {
            const contract = getContractAt(gaugeAddress, RewardsOnlyGaugeAbi);

            // so we get all events since the last synced block
            const events = await contract.queryFilter({ address: gaugeAddress }, startBlock, endBlock);

            // we filter by those events and avoid duplicated users per gauge contract by utlizing a Set
            const uniqueUserAddresses = new Set<string>();
            const filteredEvents = events.filter((event) => ['Deposit', 'Withdraw', 'Transfer'].includes(event.event!));

            for (let event of filteredEvents) {
                if (event.event === 'Transfer') {
                    if (event.args!._from !== ZERO_ADDRESS && event.args!._to !== ZERO_ADDRESS) {
                        uniqueUserAddresses.add(event.args!._from.toLowerCase());
                        uniqueUserAddresses.add(event.args!._to.toLowerCase());
                    }
                } else {
                    uniqueUserAddresses.add(event.args!.provider.toLowerCase());
                }
            }

            for (const userAddress of uniqueUserAddresses) {
                // a dot in the path nests the response on this key
                multicall.call(`${gaugeAddress}.${userAddress}`, gaugeAddress, 'balanceOf', [userAddress]);

                // so if we scheduled more than 100 calls, we execute the batch
                if (multicall.numCalls >= 100) {
                    response = _.merge(response, await multicall.execute());
                }
            }
            allUserAddress.push(...uniqueUserAddresses);
        }
        // see if we have some more calls to execute
        if (multicall.numCalls > 0) {
            response = _.merge(response, await multicall.execute());
        }

        /*
            we have an object with gaugeAddress => userAddress => balance,
            the 2nd argument of the lodash _.map function provides the key of the object
         */
        const userGaugeBalanceUpdates = _.map(response, (userBalance, gaugeAddress) => {
            // now we have an object userAddress => balance, so 2nd argument is the key which is the user address
            return _.map(userBalance, (amount, userAddress) => ({
                gaugeAddress,
                userAddress: userAddress.toLowerCase(),
                amount: formatFixed(amount, 18),
            }));
        }).flat();

        if (userGaugeBalanceUpdates.length === 0) {
            await prisma.prismaUserBalanceSyncStatus.update({
                where: { type_chain: { type: 'STAKED', chain: networkContext.chain } },
                data: { blockNumber: endBlock },
            });

            return;
        }

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: _.uniq(allUserAddress).map((address) => ({ address })),
                    skipDuplicates: true,
                }),
                ...userGaugeBalanceUpdates.map((update) => {
                    const pool = pools.find((pool) => pool.staking.some((stake) => stake.id === update.gaugeAddress));

                    return prisma.prismaUserStakedBalance.upsert({
                        where: {
                            id_chain: {
                                id: `${update.gaugeAddress}-${update.userAddress}`,
                                chain: networkContext.chain,
                            },
                        },
                        update: {
                            balance: update.amount,
                            balanceNum: parseFloat(update.amount),
                        },
                        create: {
                            id: `${update.gaugeAddress}-${update.userAddress}`,
                            chain: networkContext.chain,
                            balance: update.amount,
                            balanceNum: parseFloat(update.amount),
                            userAddress: update.userAddress,
                            poolId: pool?.id,
                            tokenAddress: pool!.address,
                            stakingId: update.gaugeAddress,
                        },
                    });
                }),
                prisma.prismaUserBalanceSyncStatus.update({
                    where: {
                        type_chain: {
                            type: 'STAKED',
                            chain: networkContext.chain,
                        },
                    },
                    data: { blockNumber: endBlock },
                }),
            ],
            true,
        );
    }

    public async syncUserBalance({ userAddress, poolId, poolAddress, staking }: UserSyncUserBalanceInput) {
        const contract = getContractAt(staking.address, RewardsOnlyGaugeAbi);
        const balance = await contract.balanceOf(userAddress);
        const amount = formatFixed(balance, 18);

        await prisma.prismaUserStakedBalance.upsert({
            where: { id_chain: { id: `${staking.address}-${userAddress}`, chain: networkContext.chain } },
            update: {
                balance: amount,
                balanceNum: parseFloat(amount),
            },
            create: {
                id: `${staking.address}-${userAddress}`,
                chain: networkContext.chain,
                balance: amount,
                balanceNum: parseFloat(amount),
                userAddress: userAddress,
                poolId: poolId,
                tokenAddress: poolAddress,
                stakingId: staking.address,
            },
        });
    }
}
