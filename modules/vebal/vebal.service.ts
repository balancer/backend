import { prisma } from '../../prisma/prisma-client';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { veBalLocksSubgraphService } from '../subgraphs/veBal-locks-subgraph/veBal-locks-subgraph.service';
import VeDelegationAbi from './abi/VotingEscrowDelegationProxy';
import { AmountHumanReadable } from '../common/global-types';
import { GqlVeBalBalance, GqlVeBalUserData } from '../../apps/api/gql/generated-schema';
import mainnet from '../../config/mainnet';
import VeBalABI from './abi/vebal';
import { Chain } from '@prisma/client';
import config from '../../config';
import { Multicaller3Viem } from '../web3/multicaller-viem';
import { getViemClient } from '../sources/viem-client';
import { formatEther } from 'viem';

export class VeBalService {
    public async getVeBalUserBalance(chain: Chain, userAddress: string): Promise<AmountHumanReadable> {
        if (config[chain].veBal) {
            const veBalUser = await prisma.prismaVeBalUserBalance.findFirst({
                where: { chain: chain, userAddress: userAddress.toLowerCase() },
            });
            if (veBalUser?.balance) {
                return veBalUser.balance;
            }
        }
        return '0.0';
    }

    public async readBalances(address: string, chains?: Chain[]): Promise<GqlVeBalBalance[]> {
        const balances = await prisma.prismaVeBalUserBalance.findMany({
            where: { userAddress: address.toLowerCase(), chain: { in: chains } },
        });

        const veBalPrice = await prisma.prismaTokenCurrentPrice.findFirstOrThrow({
            where: { chain: 'MAINNET', tokenAddress: mainnet.veBal!.bptAddress },
        });

        return balances.map((balance) => ({
            ...balance,
            lockedUsd: (parseFloat(balance.locked) * veBalPrice.price).toFixed(2),
        }));
    }

    public async getVeBalUserData(chain: Chain, userAddress: string): Promise<GqlVeBalUserData> {
        let rank = 1;
        let balance = '0.0';
        let locked = '0.0';
        if (config[chain].veBal) {
            const veBalUsers = await prisma.prismaVeBalUserBalance.findMany({
                where: { chain: chain },
            });

            const veBalUsersNum = veBalUsers.map((user) => ({
                ...user,
                balance: parseFloat(user.balance),
                locked: user.locked,
            }));

            veBalUsersNum.sort((a, b) => b.balance - a.balance);

            for (const user of veBalUsersNum) {
                if (user.userAddress === userAddress) {
                    balance = user.balance.toString();
                    locked = user.locked;
                    break;
                }
                rank++;
            }
        }

        let veBalPrice = { price: 0 };

        if (locked !== '0.0') {
            veBalPrice = await prisma.prismaTokenCurrentPrice.findFirstOrThrow({
                where: { chain: chain, tokenAddress: mainnet.veBal!.bptAddress },
            });
        }

        const snapshots = await prisma.prismaVeBalUserBalanceSnapshot.findMany({
            where: { userAddress: userAddress.toLowerCase() },
            orderBy: { timestamp: 'desc' },
        });

        return {
            balance,
            locked,
            lockedUsd: (parseFloat(locked) * veBalPrice.price).toFixed(2),
            rank: balance === '0.0' ? undefined : rank,
            lockSnapshots: snapshots,
        };
    }

    public async getVeBalTotalSupply(chain: Chain): Promise<AmountHumanReadable> {
        if (config[chain].veBal) {
            const veBal = await prisma.prismaVeBalTotalSupply.findFirst({
                where: { chain: chain },
            });
            if (veBal?.totalSupply) {
                return veBal.totalSupply;
            }
        }
        return '0.0';
    }

    async syncVeBalBalances(chain: Chain): Promise<void> {
        const subgraphVeBalHolders = await veBalLocksSubgraphService.getAllveBalHolders();
        const vebalDatabaseHolders = await prisma.prismaVeBalUserBalance.findMany({
            where: { chain: chain },
            select: { userAddress: true },
        });

        // we query all balances fresh from chain
        const veBalHolders: { address: string; balance: string; locked: string }[] = [];

        let operations: any[] = [];
        // for mainnet, we get the vebal balance form the vebal contract
        if (chain === 'MAINNET') {
            console.log(`Fetching veBal balances from mainnet contract for ${subgraphVeBalHolders.length} holders`);
            const multicall3 = new Multicaller3Viem('MAINNET', VeBalABI);

            let response = {} as {
                [userAddress: string]: {
                    balance: bigint;
                    locked: { amount: bigint };
                };
            };

            for (const holder of subgraphVeBalHolders) {
                multicall3.call(
                    `${holder.user}.balance`,
                    config[chain].veBal!.address,
                    'balanceOf',
                    [holder.user],
                );
                multicall3.call(
                    `${holder.user}.locked`,
                    config[chain].veBal!.address,
                    'locked',
                    [holder.user],
                );

                // so if we scheduled more than 100 calls, we execute the batch
                if (multicall3.numCalls >= 500) {
                    response = _.merge(response, await multicall3.execute());
                }
            }

            if (multicall3.numCalls > 0) {
                response = _.merge(response, await multicall3.execute());
            }

            for (const veBalHolder in response) {
                veBalHolders.push({
                    address: veBalHolder.toLowerCase(),
                    balance: formatEther(response[veBalHolder].balance),
                    locked: formatEther(response[veBalHolder].locked.amount),
                });
            }
        } else {
            //for L2, we get the vebal balance from the delegation proxy
            const multicall3 = new Multicaller3Viem(chain, VeDelegationAbi);

            let response = {} as {
                [userAddress: string]: bigint;
            };

            for (const holder of subgraphVeBalHolders) {
                multicall3.call(
                    holder.user,
                    config[chain].veBal!.delegationProxy,
                    'adjustedBalanceOf',
                    [holder.user],
                );

                // so if we scheduled more than 50 calls, we execute the batch
                if (multicall3.numCalls >= 50) {
                    response = _.merge(response, await multicall3.execute());
                }
            }

            if (multicall3.numCalls > 0) {
                response = _.merge(response, await multicall3.execute());
            }

            for (const veBalHolder in response) {
                veBalHolders.push({
                    address: veBalHolder.toLowerCase(),
                    balance: formatEther(response[veBalHolder]),
                    locked: '0.0',
                });
            }
        }

        // make sure all users exist
        operations.push(
            prisma.prismaUser.createMany({
                data: veBalHolders.map((user) => ({ address: user.address })),
                skipDuplicates: true,
            }),
        );

        // delete all users that no longer have a lock
        const veBalHoldersAddresses = veBalHolders.map((holder) => holder.address);
        const addressesToDelete = vebalDatabaseHolders
            .map((holder) => holder.userAddress)
            .filter((address) => !veBalHoldersAddresses.includes(address));

        operations.push(
            prisma.prismaVeBalUserBalance.deleteMany({
                where: { chain: chain, userAddress: { in: addressesToDelete } },
            }),
        );

        for (const veBalHolder of veBalHolders) {
            operations.push(
                prisma.prismaVeBalUserBalance.upsert({
                    where: { id_chain: { id: `veBal-${veBalHolder.address}`, chain: chain } },
                    create: {
                        id: `veBal-${veBalHolder.address}`,
                        chain: chain,
                        balance: veBalHolder.balance,
                        locked: veBalHolder.locked,
                        userAddress: veBalHolder.address,
                    },
                    update: {
                        balance: veBalHolder.balance,
                        locked: veBalHolder.locked,
                    },
                }),
            );
        }
        await prismaBulkExecuteOperations(operations, true, undefined);
    }

    public async syncVeBalTotalSupply(chain: Chain): Promise<void> {
        if (config[chain].veBal) {
            const veBalAddress =
                chain === 'MAINNET'
                    ? config[chain].veBal.address
                    : config[chain].veBal.delegationProxy;

            const viemClient = getViemClient(chain);
            const totalSupply = await viemClient.readContract({
                address: veBalAddress as `0x${string}`,
                abi: VeBalABI,
                functionName: 'totalSupply',
            });

            await prisma.prismaVeBalTotalSupply.upsert({
                where: {
                    address_chain: {
                        address: veBalAddress,
                        chain: chain,
                    },
                },
                create: {
                    address: veBalAddress,
                    chain: chain,
                    totalSupply: formatEther(totalSupply),
                },
                update: { totalSupply: formatEther(totalSupply) },
            });
        }
    }

    public async syncVeBalUserBalanceSnapshots(): Promise<void> {
        const latestSnapshot = await prisma.prismaVeBalUserBalanceSnapshot.findFirst({
            orderBy: { timestamp: 'desc' },
        });

        const userLocksFromSubgraph = await veBalLocksSubgraphService.getAllHistoricalLocksSince(
            latestSnapshot?.timestamp || 0,
        );
        let operations: any[] = [];

        await prisma.prismaUser.createMany({
            data: userLocksFromSubgraph.map((snapshot) => ({ address: snapshot.user.id.toLowerCase() })),
            skipDuplicates: true,
        });

        for (const lockSnapshot of userLocksFromSubgraph) {
            const balance = this.calculateVeBalBalance(
                parseFloat(lockSnapshot.bias),
                parseFloat(lockSnapshot.slope),
                lockSnapshot.timestamp,
            );
            operations.push(
                prisma.prismaVeBalUserBalanceSnapshot.upsert({
                    where: {
                        userAddress_timestamp: {
                            userAddress: lockSnapshot.user.id.toLowerCase(),
                            timestamp: lockSnapshot.timestamp,
                        },
                    },
                    create: {
                        userAddress: lockSnapshot.user.id.toLowerCase(),
                        chain: 'MAINNET',
                        timestamp: lockSnapshot.timestamp,
                        bias: lockSnapshot.bias,
                        slope: lockSnapshot.slope,
                        balance: balance.toString(),
                    },
                    update: {
                        balance: balance.toString(),
                        slope: lockSnapshot.slope,
                        bias: lockSnapshot.bias,
                    },
                }),
            );
        }

        await prismaBulkExecuteOperations(operations);
    }

    calculateVeBalBalance(bias: number, slope: number, timestamp: number): number {
        const x = slope * Math.floor(Date.now() / 1000) - timestamp;

        if (x < 0) return bias;

        const balance = bias - x;
        if (balance < 0) return 0;

        return balance;
    }
}

export const veBalService = new VeBalService();
