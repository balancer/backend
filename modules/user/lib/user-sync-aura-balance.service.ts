import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import { getContractAt } from '../../web3/contract';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { Multicaller } from '../../web3/multicaller';
import { formatFixed } from '@ethersproject/bignumber';
import { Prisma, PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../network/network-context.service';
import ERC20Abi from '../../web3/abi/ERC20.json';
import { AddressZero } from '@ethersproject/constants';
import { getEvents } from '../../web3/events';
import { AuraSubgraphService } from '../../sources/subgraphs/aura/aura.service';
import { formatEther, hexToBigInt } from 'viem';

export class UserSyncAuraBalanceService implements UserStakedBalanceService {
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

    get auraSubgraphService() {
        return new AuraSubgraphService(networkContext.data.subgraphs.aura!);
    }

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (!stakingTypes.includes('AURA')) {
            return;
        }

        const blockNumber = await this.provider.getBlockNumber();
        console.log('initAuraBalances: loading subgraph users...');
        const auraGauges = await this.auraSubgraphService.getAllPools([this.chain]);
        const accounts = await this.auraSubgraphService.getAllUsers();
        console.log('initAuraBalances: finished loading subgraph users...');
        console.log('initAuraBalances: loading pools...');

        const pools = await prisma.prismaPool.findMany({
            select: { id: true, address: true, staking: true },
            where: { chain: this.chain, address: { in: auraGauges.map((pool) => pool.lpToken.address) } },
        });

        console.log('initAuraBalances: performing db operations...');

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: accounts.map((account) => ({ address: account.id })),
                    skipDuplicates: true,
                }),
                prisma.prismaUserStakedBalance.deleteMany({ where: { staking: { type: 'AURA' }, chain: this.chain } }),
                prisma.prismaUserStakedBalance.createMany({
                    data: accounts
                        .map((account) =>
                            account.poolAccounts
                                .filter((share) => `${share.pool.chainId}` === this.chainId)
                                .map((userPosition) => {
                                    const pool = pools.find(
                                        (pool) => pool.address === userPosition.pool.lpToken.address,
                                    );
                                    if (!pool) {
                                        return undefined;
                                    }

                                    return {
                                        id: `${userPosition.pool.address}-${account.id}`,
                                        chain: this.chain,
                                        balance: formatEther(hexToBigInt(userPosition.staked)),
                                        balanceNum: parseFloat(formatEther(hexToBigInt(userPosition.staked))),
                                        userAddress: account.id,
                                        poolId: pool?.id,
                                        tokenAddress: userPosition.pool.lpToken.address,
                                        stakingId: userPosition.pool.address,
                                    };
                                }),
                        )
                        .flat()
                        .filter((entry) => entry !== undefined) as Prisma.PrismaUserStakedBalanceCreateManyInput[],
                }),
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type_chain: { type: 'AURA', chain: this.chain } },
                    create: { type: 'AURA', chain: this.chain, blockNumber: blockNumber },
                    update: { blockNumber: blockNumber },
                }),
            ],
            true,
        );

        console.log('initStakedBalances: finished...');
    }

    public async syncChangedStakedBalances(): Promise<void> {
        // we always store the latest synced block
        const status = await prisma.prismaUserBalanceSyncStatus.findUnique({
            where: { type_chain: { type: 'AURA', chain: this.chain } },
        });

        if (!status) {
            throw new Error('UserSyncAuraBalanceService: syncStakedBalances called before initStakedBalances');
        }

        const pools = await prisma.prismaPool.findMany({
            include: { staking: true },
            where: { chain: this.chain },
        });
        console.log(`user-sync-aura-balances-${this.chainId} got data from db.`);

        const latestBlock = await this.provider.getBlockNumber();
        console.log(`user-sync-aura-balances-${this.chainId} got latest block.`);

        // Get aura addresses
        const auraPoolAddresses = (
            await prisma.prismaPoolStakingAura.findMany({
                select: { auraPoolAddress: true },
                where: { chain: this.chain },
            })
        ).map((auraPool) => auraPool.auraPoolAddress);

        // we sync at most 10k blocks at a time
        const startBlock = status.blockNumber + 1;

        // no new blocks have been minted, needed for slow networks
        if (startBlock > latestBlock) {
            return;
        }

        /*
            we need to figure out which users have a changed balance on any gauge contract and update their balance,
            therefore we check all transfer events since the last synced block
         */

        // Split the range into smaller chunks to avoid RPC limits, setting up to 5 times max block range
        const toBlock = Math.min(startBlock + 5 * this.rpcMaxBlockRange, latestBlock);
        console.log(`user-sync-aura-balances-${this.chainId} block range from ${startBlock} to ${toBlock}`);
        console.log(`user-sync-aura-balances-${this.chainId} getLogs for ${auraPoolAddresses.length} gauges.`);

        const events = await getEvents(
            startBlock,
            toBlock,
            auraPoolAddresses,
            ['Transfer'],
            this.rpcUrl,
            this.rpcMaxBlockRange,
            ERC20Abi,
        );

        console.log(`user-sync-aura-balances-${this.chainId} getLogs for ${auraPoolAddresses.length} gauges done`);

        const balancesToFetch = _.uniqBy(
            events
                .map((event) => [
                    { erc20Address: event.address, userAddress: event.args?.from as string },
                    { erc20Address: event.address, userAddress: event.args?.to as string },
                ])
                .flat(),
            (entry) => entry.erc20Address + entry.userAddress,
        );

        console.log(`user-sync-aura-balances-${this.chainId} got ${balancesToFetch.length} balances to fetch.`);

        if (balancesToFetch.length === 0) {
            await prisma.prismaUserBalanceSyncStatus.update({
                where: { type_chain: { type: 'AURA', chain: this.chain } },
                data: { blockNumber: toBlock },
            });

            return;
        }

        const balances = await Multicaller.fetchBalances({
            multicallAddress: this.multicallAddress,
            provider: this.provider,
            balancesToFetch,
        });

        console.log(`user-sync-aura-balances-${this.chainId} got ${balancesToFetch.length} balances to fetch done.`);

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
                                stakingId: userBalance.erc20Address.toLowerCase(),
                            },
                        });
                    }),
                prisma.prismaUserBalanceSyncStatus.update({
                    where: {
                        type_chain: {
                            type: 'AURA',
                            chain: this.chain,
                        },
                    },
                    data: { blockNumber: toBlock },
                }),
            ],
            true,
        );
    }

    public async syncUserBalance({ userAddress, poolId, poolAddress, staking }: UserSyncUserBalanceInput) {
        const contract = getContractAt(staking.address, ERC20Abi);
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
