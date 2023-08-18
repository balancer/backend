import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import { getContractAt } from '../../web3/contract';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import RewardsOnlyGaugeAbi from './abi/RewardsOnlyGauge.json';
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants';
import { Multicaller } from '../../web3/multicaller';
import { BigNumber, ethers } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../network/network-context.service';
import ERC20Abi from '../../web3/abi/ERC20.json';
import { gaugeSubgraphService } from '../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { AddressZero } from '@ethersproject/constants';

export class UserSyncGaugeBalanceService implements UserStakedBalanceService {
    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (!stakingTypes.includes('GAUGE')) {
            return;
        }
        const { block } = await gaugeSubgraphService.getMetadata();
        console.log('initStakedBalances: loading subgraph users...');
        const gaugeShares = await gaugeSubgraphService.getAllGaugeShares();
        console.log('initStakedBalances: finished loading subgraph users...');
        console.log('initStakedBalances: loading pools...');
        const pools = await prisma.prismaPool.findMany({
            select: { id: true },
            where: { chain: networkContext.chain },
        });

        const filteredGaugeShares = gaugeShares.filter((share) => {
            const pool = pools.find((pool) => pool.id === share.gauge.poolId);
            if (pool) {
                return true;
            }
        });
        console.log('initStakedBalances: finished loading pools...');
        const userAddresses = _.uniq(filteredGaugeShares.map((share) => share.user.id));

        console.log('initStakedBalances: performing db operations...');

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: userAddresses.map((userAddress) => ({ address: userAddress })),
                    skipDuplicates: true,
                }),
                prisma.prismaUserStakedBalance.deleteMany({ where: { chain: networkContext.chain } }),
                prisma.prismaUserStakedBalance.createMany({
                    data: filteredGaugeShares.map((share) => {
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
        const gaugeAddresses = await gaugeSubgraphService.getAllGaugeAddresses();

        // we sync at most 10k blocks at a time
        const startBlock = status.blockNumber + 1;
        const endBlock =
            latestBlock - startBlock > networkContext.data.rpcMaxBlockRange
                ? startBlock + networkContext.data.rpcMaxBlockRange
                : latestBlock;

        // no new blocks have been minted, needed for slow networks
        if (startBlock > endBlock) {
            return;
        }

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

        const events: ethers.providers.Log[] = [];
        const logPromises: Promise<ethers.providers.Log[]>[] = [];
        const erc20Interface = new ethers.utils.Interface(ERC20Abi);

        console.log(`user-sync-staked-balances-${networkContext.chainId} getLogs of ${getContractAt.length} gauges`);

        for (const gaugeAddress of gaugeAddresses) {
            logPromises.push(
                networkContext.provider.getLogs({
                    //ERC20 Transfer topic
                    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
                    fromBlock: startBlock,
                    toBlock: endBlock,
                    address: gaugeAddress,
                }),
            );
        }
        const allResponses = await Promise.all(logPromises);
        console.log(
            `user-sync-staked-balances-${networkContext.chainId} getLogs of ${getContractAt.length} gauges done`,
        );

        for (const response of allResponses) {
            events.push(...response);
        }

        const balancesToFetch = _.uniqBy(
            events
                .map((event) => {
                    const parsed = erc20Interface.parseLog(event);

                    return [
                        { erc20Address: event.address, userAddress: parsed.args?.from as string },
                        { erc20Address: event.address, userAddress: parsed.args?.to as string },
                    ];
                })
                .flat(),
            (entry) => entry.erc20Address + entry.userAddress,
        );

        console.log(
            `user-sync-staked-balances-${networkContext.chainId} got ${balancesToFetch.length} balances to fetch.`,
        );

        if (balancesToFetch.length === 0) {
            await prisma.prismaUserBalanceSyncStatus.update({
                where: { type_chain: { type: 'STAKED', chain: networkContext.chain } },
                data: { blockNumber: endBlock },
            });

            return;
        }

        const balances = await Multicaller.fetchBalances({
            multicallAddress: networkContext.data.multicall,
            provider: networkContext.provider,
            balancesToFetch,
        });

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: _.uniq(allUserAddress).map((address) => ({ address })),
                    skipDuplicates: true,
                }),
                ...balances
                    .filter(({ userAddress }) => userAddress !== AddressZero)
                    .map((userBalance) => {
                        const pool = pools.find((pool) =>
                            pool.staking.some((stake) => stake.id === userBalance.erc20Address),
                        );

                        return prisma.prismaUserStakedBalance.upsert({
                            where: {
                                id_chain: {
                                    id: `${userBalance.erc20Address}-${userBalance.userAddress}`,
                                    chain: networkContext.chain,
                                },
                            },
                            update: {
                                balance: formatFixed(userBalance.balance, 18),
                                balanceNum: parseFloat(formatFixed(userBalance.balance, 18)),
                            },
                            create: {
                                id: `${userBalance.erc20Address}-${userBalance.userAddress}`,
                                chain: networkContext.chain,
                                balance: formatFixed(userBalance.balance, 18),
                                balanceNum: parseFloat(formatFixed(userBalance.balance, 18)),
                                userAddress: userBalance.userAddress,
                                poolId: pool?.id,
                                tokenAddress: pool!.address,
                                stakingId: userBalance.erc20Address,
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
