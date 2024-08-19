import { formatFixed } from '@ethersproject/bignumber';
import { prisma } from '../../prisma/prisma-client';
import { BigNumber } from 'ethers';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { networkContext } from '../network/network-context.service';
import { veBalLocksSubgraphService } from '../subgraphs/veBal-locks-subgraph/veBal-locks-subgraph.service';
import { Multicaller } from '../web3/multicaller';
import VeDelegationAbi from './abi/VotingEscrowDelegationProxy.json';
import { getContractAt } from '../web3/contract';
import { AmountHumanReadable } from '../common/global-types';
import { GqlVeBalBalance, GqlVeBalUserData } from '../../schema';
import mainnet from '../../config/mainnet';
import VeBalABI from './abi/vebal.json';
import { Chain } from '@prisma/client';

export class VeBalService {
    public async getVeBalUserBalance(chain: Chain, userAddress: string): Promise<AmountHumanReadable> {
        if (networkContext.data.veBal) {
            const veBalUser = await prisma.prismaVeBalUserBalance.findFirst({
                where: { chain: chain, userAddress: userAddress.toLowerCase() },
            });
            if (veBalUser?.balance) {
                return veBalUser.balance;
            }
        }
        return '0.0';
    }

    public async readBalances(address: string): Promise<GqlVeBalBalance[]> {
        const balances = await prisma.prismaVeBalUserBalance.findMany({
            where: { userAddress: address.toLowerCase() },
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
        if (networkContext.data.veBal) {
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

        return {
            balance,
            locked,
            lockedUsd: (parseFloat(locked) * veBalPrice.price).toFixed(2),
            rank: balance === '0.0' ? undefined : rank,
        };
    }

    public async getVeBalTotalSupply(chain: Chain): Promise<AmountHumanReadable> {
        if (networkContext.data.veBal) {
            const veBal = await prisma.prismaVeBalTotalSupply.findFirst({
                where: { chain: chain },
            });
            if (veBal?.totalSupply) {
                return veBal.totalSupply;
            }
        }
        return '0.0';
    }

    async syncVeBalBalances() {
        const subgraphVeBalHolders = await veBalLocksSubgraphService.getAllveBalHolders();

        // we query all balances fresh from chain
        const veBalHolders: { address: string; balance: string; locked: string }[] = [];

        let operations: any[] = [];
        // for mainnet, we get the vebal balance form the vebal contract
        if (networkContext.isMainnet) {
            const multicall = new Multicaller(networkContext.data.multicall, networkContext.provider, VeBalABI);

            let response = {} as {
                [userAddress: string]: {
                    balance: BigNumber;
                    locked: BigNumber[];
                };
            };

            for (const holder of subgraphVeBalHolders) {
                multicall.call(`${holder.user}.balance`, networkContext.data.veBal!.address, 'balanceOf', [
                    holder.user,
                ]);
                multicall.call(`${holder.user}.locked`, networkContext.data.veBal!.address, 'locked', [holder.user]);

                // so if we scheduled more than 100 calls, we execute the batch
                if (multicall.numCalls >= 100) {
                    response = _.merge(response, await multicall.execute());
                }
            }

            if (multicall.numCalls > 0) {
                response = _.merge(response, await multicall.execute());
            }

            for (const veBalHolder in response) {
                veBalHolders.push({
                    address: veBalHolder.toLowerCase(),
                    balance: formatFixed(response[veBalHolder].balance, 18),
                    locked: formatFixed(response[veBalHolder].locked[0], 18),
                });
            }
        } else {
            //for L2, we get the vebal balance from the delegation proxy
            const multicall = new Multicaller(networkContext.data.multicall, networkContext.provider, VeDelegationAbi);

            let response = {} as {
                [userAddress: string]: BigNumber;
            };

            for (const holder of subgraphVeBalHolders) {
                multicall.call(holder.user, networkContext.data.veBal!.delegationProxy, 'adjustedBalanceOf', [
                    holder.user,
                ]);

                // so if we scheduled more than 100 calls, we execute the batch
                if (multicall.numCalls >= 100) {
                    response = _.merge(response, await multicall.execute());
                }
            }

            if (multicall.numCalls > 0) {
                response = _.merge(response, await multicall.execute());
            }

            for (const veBalHolder in response) {
                veBalHolders.push({
                    address: veBalHolder.toLowerCase(),
                    balance: formatFixed(response[veBalHolder], 18),
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

        for (const veBalHolder of veBalHolders) {
            operations.push(
                prisma.prismaVeBalUserBalance.upsert({
                    where: { id_chain: { id: `veBal-${veBalHolder.address}`, chain: networkContext.chain } },
                    create: {
                        id: `veBal-${veBalHolder.address}`,
                        chain: networkContext.chain,
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

    public async syncVeBalTotalSupply(): Promise<void> {
        if (networkContext.data.veBal) {
            const veBalAddress = networkContext.isMainnet
                ? networkContext.data.veBal.address
                : networkContext.data.veBal.delegationProxy;

            const veBal = getContractAt(veBalAddress, VeBalABI);
            const totalSupply: BigNumber = await veBal.totalSupply();

            await prisma.prismaVeBalTotalSupply.upsert({
                where: {
                    address_chain: {
                        address: veBalAddress,
                        chain: networkContext.chain,
                    },
                },
                create: {
                    address: veBalAddress,
                    chain: networkContext.chain,
                    totalSupply: formatFixed(totalSupply, 18),
                },
                update: { totalSupply: formatFixed(totalSupply, 18) },
            });
        }
    }
}

export const veBalService = new VeBalService();
