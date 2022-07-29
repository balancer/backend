import { balancerSubgraphService } from '../../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { AddressZero } from '@ethersproject/constants';
import { jsonRpcProvider } from '../../on-chain/contract';
import ERC20Abi from '../abi/ERC20.json';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { Multicaller } from '../../multicaller/multicaller';
import { networkConfig } from '../../config/network-config';
import { formatFixed } from '@ethersproject/bignumber';
import { ethers } from 'ethers';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { BalancerUserPoolShare } from '../../subgraphs/balancer-subgraph/balancer-subgraph-types';
import { beetsBarService } from '../../subgraphs/beets-bar-subgraph/beets-bar.service';
import { BeetsBarUserFragment } from '../../subgraphs/beets-bar-subgraph/generated/beets-bar-subgraph-types';

export class UserSyncWalletBalanceService {
    public async initBalancesForPools() {
        console.log('initBalancesForPools: loading balances, pools, block...');
        const { block } = await balancerSubgraphService.getMetadata();
        const { block: beetsBarBlock } = await beetsBarService.getMetadata();
        const balances = await prisma.prismaUserWalletBalance.findMany({});
        const pools = await prisma.prismaPool.findMany({
            select: { id: true, address: true },
            where: { dynamicData: { totalSharesNum: { gt: 0.000000000001 } } },
        });
        const poolIdsToInit = pools
            .filter((pool) => balances.filter((balance) => balance.poolId === pool.id).length === 0)
            .map((pool) => pool.id);
        const chunks = _.chunk(poolIdsToInit, 100);
        let shares: BalancerUserPoolShare[] = [];

        console.log('initBalancesForPools: loading pool shares...');
        for (const chunk of chunks) {
            shares = [
                ...shares,
                ...(await balancerSubgraphService.getAllPoolShares({
                    where: {
                        poolId_in: chunk,
                        userAddress_not_in: [AddressZero, networkConfig.balancer.vault.toLowerCase()],
                        balance_not: '0',
                    },
                })),
            ];
        }
        console.log('initBalancesForPools: finished loading pool shares...');

        const fbeetsHolders = await beetsBarService.getAllUsers({ where: { fBeets_not: '0' } });

        let operations: any[] = [];

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
        await prismaBulkExecuteOperations([
            prisma.prismaUser.createMany({
                data: _.uniq([
                    ...shares.map((share) => share.userAddress),
                    ...fbeetsHolders.map((user) => user.address),
                ]).map((address) => ({ address })),
                skipDuplicates: true,
            }),
            ...operations,
            ...fbeetsHolders.map((user) => this.getPrismaUpsertForFbeetsUser(user)),
            prisma.prismaUserBalanceSyncStatus.upsert({
                where: { type: 'WALLET' },
                create: { type: 'WALLET', blockNumber: Math.min(block.number, beetsBarBlock.number) },
                update: { blockNumber: Math.min(block.number, beetsBarBlock.number) },
            }),
        ]);
        console.log('initBalancesForPools: finished performing db operations...');
    }

    public async syncBalancesForAllPools() {
        const erc20Interface = new ethers.utils.Interface(ERC20Abi);
        const latestBlock = await jsonRpcProvider.getBlockNumber();
        const syncStatus = await prisma.prismaUserBalanceSyncStatus.findUnique({ where: { type: 'WALLET' } });
        const response = await prisma.prismaPool.findMany({ select: { id: true, address: true } });
        const poolAddresses = response.map((item) => item.address);

        if (!syncStatus) {
            throw new Error('UserWalletBalanceService: syncBalances called before initBalances');
        }

        const fromBlock = syncStatus.blockNumber + 1;
        const toBlock = latestBlock - fromBlock > 500 ? fromBlock + 500 : latestBlock;

        //fetch all transfer events for the block range
        const events = await jsonRpcProvider.getLogs({
            //ERC20 Transfer topic
            topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
            fromBlock,
            toBlock,
        });

        const balancesToFetch = _.uniq(
            events
                .filter((event) =>
                    //we also need to track fbeets balance
                    [...poolAddresses, networkConfig.fbeets.address].includes(event.address.toLowerCase()),
                )
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
                    const poolId = response.find((item) => item.address === erc20Address)?.id;

                    return prisma.prismaUserWalletBalance.upsert({
                        where: { id: `${poolId}-${userAddress}` },
                        create: {
                            id: `${poolId}-${userAddress}`,
                            userAddress,
                            poolId,
                            tokenAddress: erc20Address,
                            balance: formatFixed(balance, 18),
                            balanceNum: parseFloat(formatFixed(balance, 18)),
                        },
                        update: { balance: formatFixed(balance, 18), balanceNum: parseFloat(formatFixed(balance, 18)) },
                    });
                }),
            prisma.prismaUserBalanceSyncStatus.upsert({
                where: { type: 'WALLET' },
                create: { type: 'WALLET', blockNumber: toBlock },
                update: { blockNumber: toBlock },
            }),
        ]);
    }

    public async initBalancesForPool(poolId: string) {
        const { block } = await balancerSubgraphService.getMetadata();
        const shares = await balancerSubgraphService.getAllPoolShares({
            where: { poolId, userAddress_not: AddressZero, balance_not: '0' },
        });

        await prismaBulkExecuteOperations([
            prisma.prismaUser.createMany({
                data: shares.map((share) => ({ address: share.userAddress })),
                skipDuplicates: true,
            }),
            ...shares.map((share) => this.getPrismaUpsertForPoolShare(poolId, share)),
            prisma.prismaUserBalanceSyncStatus.upsert({
                where: { type: 'WALLET' },
                create: { type: 'WALLET', blockNumber: block.number },
                update: { blockNumber: block.number },
            }),
        ]);
    }

    private getPrismaUpsertForPoolShare(poolId: string, share: BalancerUserPoolShare) {
        return prisma.prismaUserWalletBalance.upsert({
            where: { id: `${poolId}-${share.userAddress}` },
            create: {
                id: `${poolId}-${share.userAddress}`,
                userAddress: share.userAddress,
                poolId,
                tokenAddress: share.poolAddress.toLowerCase(),
                balance: share.balance,
                balanceNum: parseFloat(share.balance),
            },
            update: { balance: share.balance, balanceNum: parseFloat(share.balance) },
        });
    }

    private getPrismaUpsertForFbeetsUser(user: BeetsBarUserFragment) {
        return prisma.prismaUserWalletBalance.upsert({
            where: { id: `fbeets-${user.address}` },
            create: {
                id: `fbeets-${user.address}`,
                userAddress: user.address,
                tokenAddress: networkConfig.fbeets.address,
                balance: user.fBeets,
                balanceNum: parseFloat(user.fBeets),
            },
            update: { balance: user.fBeets, balanceNum: parseFloat(user.fBeets) },
        });
    }
}
