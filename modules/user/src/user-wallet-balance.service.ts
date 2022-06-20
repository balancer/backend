import { balancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { AddressZero, Zero } from '@ethersproject/constants';
import { getContractAt, jsonRpcProvider } from '../../util/ethers';
import ERC20Abi from '../../abi/ERC20.json';
import { prisma } from '../../util/prisma-client';
import _ from 'lodash';
import { Multicaller } from '../../util/multicaller';
import { networkConfig } from '../../config/network-config';
import { formatFixed } from '@ethersproject/bignumber';
import { ethers } from 'ethers';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';

export class UserWalletBalanceService {
    constructor() {}

    public async initBalancesForAllPools() {
        const pools = await prisma.prismaPool.findMany({
            select: { id: true, address: true },
            where: {
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                },
            },
        });

        for (const pool of pools) {
            await this.initBalancesForPool(pool.id);
        }
    }

    public async initBalancesForMissingPools() {
        const pools = await prisma.prismaPool.findMany({
            select: { id: true, address: true },
            where: {
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                },
            },
        });

        const syncStatuses = await prisma.prismaUserPoolSyncStatus.findMany({});

        for (const pool of pools) {
            const status = syncStatuses.find((status) => status.id === pool.id);

            if (!status) {
                await this.initBalancesForPool(pool.id);
            }
        }
    }

    public async syncBalancesForAllPools() {
        const erc20Interface = new ethers.utils.Interface(ERC20Abi);
        const latestBlock = await jsonRpcProvider.getBlockNumber();
        const oldestSyncStatus = await prisma.prismaUserPoolSyncStatus.findFirst({ orderBy: { blockNumber: 'asc' } });
        const response = await prisma.prismaPool.findMany({ select: { id: true, address: true } });
        const poolAddresses = response.map((item) => item.address);
        const poolIds = response.map((item) => item.id);
        const fromBlock = oldestSyncStatus ? oldestSyncStatus.blockNumber + 1 : latestBlock;
        const toBlock = latestBlock - fromBlock > 1000 ? fromBlock + 1000 : latestBlock;

        //fetch all transfer events for the block range
        const events = await jsonRpcProvider.getLogs({
            //ERC20 Transfer topic
            topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
            fromBlock,
            toBlock,
        });

        const balancesToFetch = _.uniq(
            events
                .filter((event) => poolAddresses.includes(event.address.toLowerCase()))
                .map((event) => {
                    const parsed = erc20Interface.parseLog(event);

                    return [
                        { erc20Address: event.address, userAddress: parsed.args?.from as string },
                        { erc20Address: event.address, userAddress: parsed.args?.to as string },
                    ];
                })
                .flat(),
        );

        if (balancesToFetch.length === 0) {
            return;
        }

        const balances = await Multicaller.fetchBalances({
            multicallAddress: networkConfig.multicall,
            provider: jsonRpcProvider,
            balancesToFetch,
        });

        await prismaBulkExecuteOperations([
            //make sure all users exist
            prisma.prismaUser.createMany({
                data: balances.map((item) => ({ address: item.userAddress })),
                skipDuplicates: true,
            }),
            //update balances
            ...balances
                .filter(({ userAddress }) => userAddress !== AddressZero)
                .map(({ userAddress, erc20Address, balance }) => {
                    const poolId =
                        response.find((item) => {
                            return item.address === erc20Address.toLowerCase();
                        })?.id || '';

                    return prisma.prismaUserWalletBalance.upsert({
                        where: { id: `${poolId}-${userAddress}` },
                        create: {
                            id: `${poolId}-${userAddress}`,
                            userAddress,
                            poolId,
                            balance: formatFixed(balance, 18),
                        },
                        update: { balance: formatFixed(balance, 18) },
                    });
                }),
            //update block numbers
            prisma.prismaUserPoolSyncStatus.updateMany({
                where: { id: { in: poolIds } },
                data: { blockNumber: toBlock },
            }),
        ]);
    }

    public async initBalancesForPool(poolId: string) {
        const { block } = await balancerSubgraphService.getMetadata();
        const pool = await prisma.prismaPool.findUnique({ where: { id: poolId } });

        if (!pool) {
            throw new Error(`pool with id not found ${poolId}`);
        }

        const shares = await balancerSubgraphService.getAllPoolShares({
            where: {
                poolId,
                userAddress_not: AddressZero,
                balance_not: '0',
            },
        });

        const providerLatestBlock = await jsonRpcProvider.getBlockNumber();

        const contract = getContractAt(pool.address, ERC20Abi);
        const transferEventFilter = contract.filters.Transfer();
        //fetch all events that have happened beyond the currently synced subgraph block
        const events = await contract.queryFilter(transferEventFilter, block.number + 1);
        const addresses: string[] = _.uniq(events.map((event) => [event.args?.from, event.args?.to]).flat());

        const balances = await Multicaller.fetchBalances({
            multicallAddress: networkConfig.multicall,
            provider: jsonRpcProvider,
            balancesToFetch: addresses.map((userAddress) => ({ userAddress, erc20Address: pool.address })),
        });

        _.forEach(balances, ({ balance, userAddress }) => {
            const share = shares.find((share) => share.userAddress === userAddress);

            if (share) {
                share.balance = formatFixed(balance, 18);
            } else if (balance.gt(Zero)) {
                shares.push({
                    id: `${pool.id}-${userAddress}`,
                    balance: formatFixed(balance, 18),
                    userAddress,
                    poolAddress: pool.address,
                });
            }
        });

        const operations = shares.map((share) =>
            prisma.prismaUserWalletBalance.upsert({
                where: { id: `${pool.id}-${share.userAddress}` },
                create: {
                    id: `${pool.id}-${share.userAddress}`,
                    userAddress: share.userAddress,
                    poolId: pool.id,
                    balance: share.balance,
                },
                update: { balance: share.balance },
            }),
        );

        await prismaBulkExecuteOperations([
            prisma.prismaUser.createMany({
                data: shares.map((share) => ({ address: share.userAddress })),
                skipDuplicates: true,
            }),
            ...operations,
            prisma.prismaUserPoolSyncStatus.upsert({
                where: { id: poolId },
                create: { id: poolId, blockNumber: block.number },
                update: { blockNumber: providerLatestBlock },
            }),
        ]);
    }
}
