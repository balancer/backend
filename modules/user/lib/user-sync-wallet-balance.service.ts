import { isSameAddress } from '@balancer-labs/sdk';
import { formatFixed } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import { ethers } from 'ethers';
import _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { BalancerUserPoolShare } from '../../subgraphs/balancer-subgraph/balancer-subgraph-types';
import { balancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { beetsBarService } from '../../subgraphs/beets-bar-subgraph/beets-bar.service';
import { BeetsBarUserFragment } from '../../subgraphs/beets-bar-subgraph/generated/beets-bar-subgraph-types';
import { Multicaller, MulticallUserBalance } from '../../web3/multicaller';
import ERC20Abi from '../../web3/abi/ERC20.json';
import { networkContext } from '../../network/network-context.service';

export class UserSyncWalletBalanceService {
    constructor() {}
    public async initBalancesForPools() {
        console.log('initBalancesForPools: loading balances, pools, block...');
        const { block } = await balancerSubgraphService.getMetadata();

        let endBlock = block.number;

        if (networkContext.isFantomNetwork) {
            const { block: beetsBarBlock } = await beetsBarService.getMetadata();
            endBlock = Math.min(endBlock, beetsBarBlock.number);
        }

        const pools = await prisma.prismaPool.findMany({
            select: { id: true, address: true },
            where: { dynamicData: { totalSharesNum: { gt: 0.000000000001 } }, chain: networkContext.chain },
        });
        const poolIdsToInit = pools.map((pool) => pool.id);
        const shares = await balancerSubgraphService.getAllPoolSharesWithBalance(poolIdsToInit, [
            AddressZero,
            networkContext.data.balancer.vault,
        ]);

        let fbeetsHolders: BeetsBarUserFragment[] = [];

        if (networkContext.isFantomNetwork) {
            fbeetsHolders = await beetsBarService.getAllUsers({ where: { fBeets_not: '0' } });
        }

        let operations: any[] = [];
        operations.push(prisma.prismaUserWalletBalance.deleteMany({ where: { chain: networkContext.chain } }));

        for (const pool of pools) {
            const poolShares = shares.filter((share) => share.poolAddress.toLowerCase() === pool.address);

            if (poolShares.length > 0) {
                operations = [
                    ...operations,
                    ...poolShares.map((share) => this.getPrismaUpsertForPoolShare(pool.id, share)),
                ];
            }
        }

        console.log('initBalancesForPools: performing db operations...');
        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: _.uniq([
                        ...shares.map((share) => share.userAddress),
                        ...fbeetsHolders.map((user) => user.address),
                    ]).map((address) => ({ address })),
                    skipDuplicates: true,
                }),
                ...operations,
                ...fbeetsHolders.map((user) => this.getUserWalletBalanceUpsertForFbeets(user.address, user.fBeets)),
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type_chain: { type: 'WALLET', chain: networkContext.chain } },
                    create: { type: 'WALLET', blockNumber: endBlock, chain: networkContext.chain },
                    update: { blockNumber: Math.min(block.number, endBlock) },
                }),
            ],
            true,
        );
        console.log('initBalancesForPools: finished performing db operations...');
    }

    public async syncChangedBalancesForAllPools() {
        const erc20Interface = new ethers.utils.Interface(ERC20Abi);
        const latestBlock = await networkContext.provider.getBlockNumber();
        const syncStatus = await prisma.prismaUserBalanceSyncStatus.findUnique({
            where: { type_chain: { type: 'WALLET', chain: networkContext.chain } },
        });
        const response = await prisma.prismaPool.findMany({
            select: { id: true, address: true },
            where: { chain: networkContext.chain },
        });
        const poolAddresses = response.map((item) => item.address);

        if (!syncStatus) {
            throw new Error('UserWalletBalanceService: syncBalances called before initBalances');
        }

        const fromBlock = syncStatus.blockNumber + 1;
        const toBlock = latestBlock - fromBlock > 200 ? fromBlock + 200 : latestBlock;

        // no new blocks have been minted, needed for slow networks
        if (fromBlock > toBlock) {
            return;
        }

        //fetch all transfer events for the block range
        const events = await networkContext.provider.getLogs({
            //ERC20 Transfer topic
            topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
            fromBlock,
            toBlock,
        });

        const relevantERC20Addresses = poolAddresses;

        if (networkContext.isFantomNetwork) {
            relevantERC20Addresses.push(networkContext.data.fbeets!.address);
        }

        const balancesToFetch = _.uniqBy(
            events
                .filter((event) =>
                    //we also need to track fbeets balance
                    relevantERC20Addresses.includes(event.address.toLowerCase()),
                )
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

        if (balancesToFetch.length === 0) {
            await prisma.prismaUserBalanceSyncStatus.upsert({
                where: { type_chain: { type: 'WALLET', chain: networkContext.chain } },
                create: { type: 'WALLET', chain: networkContext.chain, blockNumber: toBlock },
                update: { blockNumber: toBlock },
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
                //make sure all users exist
                prisma.prismaUser.createMany({
                    data: balances.map((item) => ({ address: item.userAddress })),
                    skipDuplicates: true,
                }),
                //update balances
                ...balances
                    .filter(({ userAddress }) => userAddress !== AddressZero)
                    .map((userBalance) => {
                        if (
                            networkContext.isFantomNetwork &&
                            isSameAddress(userBalance.erc20Address, networkContext.data.fbeets!.address)
                        ) {
                            return this.getUserWalletBalanceUpsertForFbeets(
                                userBalance.userAddress,
                                formatFixed(userBalance.balance, 18),
                            );
                        }
                        const poolId = response.find((item) => item.address === userBalance.erc20Address)?.id;
                        return this.getUserWalletBalanceUpsert(userBalance, poolId!);
                    }),
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type_chain: { type: 'WALLET', chain: networkContext.chain } },
                    create: { type: 'WALLET', chain: networkContext.chain, blockNumber: toBlock },
                    update: { blockNumber: toBlock },
                }),
            ],
            true,
        );
    }

    public async initBalancesForPool(poolId: string) {
        const { block } = await balancerSubgraphService.getMetadata();

        const shares = await balancerSubgraphService.getAllPoolSharesWithBalance([poolId], [AddressZero]);

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: shares.map((share) => ({ address: share.userAddress })),
                    skipDuplicates: true,
                }),
                ...shares.map((share) => this.getPrismaUpsertForPoolShare(poolId, share)),
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type_chain: { type: 'WALLET', chain: networkContext.chain } },
                    create: { type: 'WALLET', chain: networkContext.chain, blockNumber: block.number },
                    update: { blockNumber: block.number },
                }),
            ],
            true,
        );
    }

    public async syncUserBalance(userAddress: string, poolId: string, poolAddresses: string) {
        const balancesToFetch = [{ erc20Address: poolAddresses, userAddress }];

        if (networkContext.isFantomNetwork && isSameAddress(networkContext.data.fbeets!.poolAddress, poolAddresses)) {
            balancesToFetch.push({ erc20Address: networkContext.data.fbeets!.address, userAddress });
        }

        const balances = await Multicaller.fetchBalances({
            multicallAddress: networkContext.data.multicall,
            provider: networkContext.provider,
            balancesToFetch,
        });

        const operations = balances.map((userBalance) => this.getUserWalletBalanceUpsert(userBalance, poolId));

        await Promise.all(operations);
    }

    private getPrismaUpsertForPoolShare(poolId: string, share: BalancerUserPoolShare) {
        return prisma.prismaUserWalletBalance.upsert({
            where: { id_chain: { id: `${poolId}-${share.userAddress}`, chain: networkContext.chain } },
            create: {
                id: `${poolId}-${share.userAddress}`,
                chain: networkContext.chain,
                userAddress: share.userAddress,
                poolId,
                tokenAddress: share.poolAddress.toLowerCase(),
                balance: share.balance,
                balanceNum: parseFloat(share.balance),
            },
            update: { balance: share.balance, balanceNum: parseFloat(share.balance) },
        });
    }

    private getUserWalletBalanceUpsertForFbeets(userAddress: string, balance: string) {
        return prisma.prismaUserWalletBalance.upsert({
            where: { id_chain: { id: `fbeets-${userAddress}`, chain: networkContext.chain } },
            create: {
                id: `fbeets-${userAddress}`,
                chain: networkContext.chain,
                userAddress: userAddress,
                tokenAddress: networkContext.data.fbeets!.address,
                balance,
                balanceNum: parseFloat(balance),
            },
            update: { balance: balance, balanceNum: parseFloat(balance) },
        });
    }

    private getUserWalletBalanceUpsert(userBalance: MulticallUserBalance, poolId: string) {
        const { userAddress, balance, erc20Address } = userBalance;

        return prisma.prismaUserWalletBalance.upsert({
            where: { id_chain: { id: `${poolId}-${userAddress}`, chain: networkContext.chain } },
            create: {
                id: `${poolId}-${userAddress}`,
                chain: networkContext.chain,
                userAddress,
                poolId,
                tokenAddress: erc20Address,
                balance: formatFixed(balance, 18),
                balanceNum: parseFloat(formatFixed(balance, 18)),
            },
            update: {
                balance: formatFixed(balance, 18),
                balanceNum: parseFloat(formatFixed(balance, 18)),
            },
        });
    }
}
