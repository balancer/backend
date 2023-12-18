import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import { getContractAt } from '../../web3/contract';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import RewardsOnlyGaugeAbi from './abi/RewardsOnlyGauge.json';
import { Multicaller } from '../../web3/multicaller';
import { ethers } from 'ethers';
import { formatFixed } from '@ethersproject/bignumber';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../network/network-context.service';
import ERC20Abi from '../../web3/abi/ERC20.json';
import { gaugeSubgraphService } from '../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { AddressZero } from '@ethersproject/constants';

export class UserSyncGaugeBalanceService implements UserStakedBalanceService {
    get chain() {
        return networkContext.chain;
    }

    get chainId() {
        return networkContext.chainId;
    }

    get provider() {
        return networkContext.provider;
    }

    get rpcUrl() {
        return networkContext.data.rpcUrl;
    }

    get rpcMaxBlockRange() {
        return networkContext.data.rpcMaxBlockRange;
    }

    get multicallAddress() {
        return networkContext.data.multicall;
    }

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
            where: { chain: this.chain },
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
                prisma.prismaUserStakedBalance.deleteMany({ where: { chain: this.chain } }),
                prisma.prismaUserStakedBalance.createMany({
                    data: filteredGaugeShares.map((share) => {
                        const pool = pools.find((pool) => pool.id === share.gauge.poolId);

                        return {
                            id: `${share.gauge.id}-${share.user.id}`,
                            chain: this.chain,
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
                    where: { type_chain: { type: 'STAKED', chain: this.chain } },
                    create: { type: 'STAKED', chain: this.chain, blockNumber: block.number },
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
            where: { type_chain: { type: 'STAKED', chain: this.chain } },
        });

        if (!status) {
            throw new Error('UserSyncGaugeBalanceService: syncStakedBalances called before initStakedBalances');
        }

        const pools = await prisma.prismaPool.findMany({
            include: { staking: true },
            where: { chain: this.chain },
        });
        console.log(`user-sync-staked-balances-${this.chainId} got data from db.`);

        const latestBlock = await this.provider.getBlockNumber();
        console.log(`user-sync-staked-balances-${this.chainId} got latest block.`);

        // Get gauge addresses
        const gaugeAddresses = (
            await prisma.prismaPoolStakingGauge.findMany({
                select: { gaugeAddress: true },
                where: { chain: this.chain },
            })
        ).map((gauge) => gauge.gaugeAddress);

        // we sync at most 10k blocks at a time
        const startBlock = status.blockNumber + 1;
        const endBlock = latestBlock;

        // no new blocks have been minted, needed for slow networks
        if (startBlock > endBlock) {
            return;
        }

        /*
            we need to figure out which users have a changed balance on any gauge contract and update their balance,
            therefore we check all transfer events since the last synced block
         */
        const erc20Interface = new ethers.utils.Interface(ERC20Abi);

        // Split the range into smaller chunks to avoid RPC limits, setting up to 50 times max block range
        const toBlock = Math.min(startBlock + 50 * this.rpcMaxBlockRange, latestBlock);
        const range = toBlock - startBlock;
        console.log(`user-sync-staked-balances-${this.chainId} block range from ${startBlock} to ${toBlock}`);
        console.log(`user-sync-staked-balances-${this.chainId} getLogs for ${_.uniq(gaugeAddresses).length} gauges.`);
        const events = await Promise.all(
            // Getting logs in batches of max blocks allowed by RPC
            Array.from({ length: Math.ceil(range / this.rpcMaxBlockRange) }, (_, i) => i).map(async (i) => {
                const from = startBlock + i * this.rpcMaxBlockRange;
                const to = Math.min(startBlock + (i + 1) * this.rpcMaxBlockRange, toBlock);

                // Usually RPCs are handling any number of addresses, but it here batching just to be on the safe side
                const logRequests: Promise<ethers.providers.Log[]>[] = _.chunk(gaugeAddresses, 500).map((addresses) => {
                    // Fetch logs with a raw json request until we support Viem or Ethers6
                    const payload = {
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'eth_getLogs',
                        params: [
                            {
                                address: addresses,
                                topics: [ethers.utils.id('Transfer(address,address,uint256)')],
                                fromBlock: '0x' + BigInt(from).toString(16),
                                toBlock: '0x' + BigInt(to).toString(16),
                            },
                        ],
                    };

                    return fetch(this.rpcUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    })
                        .then((response) => response.json() as Promise<{ result: ethers.providers.Log[] }>)
                        .then(({ result }) => result)
                        .catch((error) => {
                            console.error('Error fetching logs:', error);
                            return [];
                        });
                });

                const events = await Promise.all(logRequests).then((res) => res.flat());

                return events;
            }),
        ).then((res) => res.flat().filter((event) => event));

        console.log(`user-sync-staked-balances-${this.chainId} getLogs for ${gaugeAddresses.length} gauges done`);

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

        console.log(`user-sync-staked-balances-${this.chainId} got ${balancesToFetch.length} balances to fetch.`);

        if (balancesToFetch.length === 0) {
            await prisma.prismaUserBalanceSyncStatus.update({
                where: { type_chain: { type: 'STAKED', chain: this.chain } },
                data: { blockNumber: endBlock },
            });

            return;
        }

        const balances = await Multicaller.fetchBalances({
            multicallAddress: this.multicallAddress,
            provider: this.provider,
            balancesToFetch,
        });

        console.log(`user-sync-staked-balances-${this.chainId} got ${balancesToFetch.length} balances to fetch done.`);

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: _.uniq(balances.map((balance) => balance.userAddress)).map((address) => ({ address })),
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
                                    chain: this.chain,
                                },
                            },
                            update: {
                                balance: formatFixed(userBalance.balance, 18),
                                balanceNum: parseFloat(formatFixed(userBalance.balance, 18)),
                            },
                            create: {
                                id: `${userBalance.erc20Address}-${userBalance.userAddress}`,
                                chain: this.chain,
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
                            chain: this.chain,
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
            where: { id_chain: { id: `${staking.address}-${userAddress}`, chain: this.chain } },
            update: {
                balance: amount,
                balanceNum: parseFloat(amount),
            },
            create: {
                id: `${staking.address}-${userAddress}`,
                chain: this.chain,
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
