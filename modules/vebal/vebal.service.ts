import { formatFixed } from '@ethersproject/bignumber';
import { prisma } from '../../prisma/prisma-client';
import { BigNumber } from 'ethers';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../prisma/prisma-util';
import { networkContext } from '../network/network-context.service';
import { veBalLocksSubgraphService } from '../subgraphs/veBal-locks-subgraph/veBal-locks-subgraph.service';
import { Multicaller } from '../web3/multicaller';
import ERC20Abi from '../web3/abi/ERC20.json';
import VeDelegationAbi from './abi/VotingEscrowDelegationProxy.json';
import { getContractAt } from '../web3/contract';
import { AmountHumanReadable } from '../common/global-types';
import { GqlVeBalUserData } from '../../schema';

export class VeBalService {
    public async getVeBalUserBalance(userAddress: string): Promise<AmountHumanReadable> {
        if (networkContext.data.veBal) {
            const veBalUser = await prisma.prismaVeBalUserBalance.findFirst({
                where: { chain: networkContext.chain, userAddress: userAddress.toLowerCase() },
            });
            if (veBalUser?.balance) {
                return veBalUser.balance;
            }
        }
        return '0.0';
    }

    public async getVeBalUserData(userAddress: string): Promise<GqlVeBalUserData> {
        let rank = 1;
        let balance = '0.0';
        if (networkContext.data.veBal) {
            const veBalUsers = await prisma.prismaVeBalUserBalance.findMany({
                where: { chain: networkContext.chain },
                orderBy: { balance: 'desc' },
            });

            for (const user of veBalUsers) {
                if (user.userAddress === userAddress) {
                    balance = user.balance;
                    break;
                }
                rank++;
            }
        }
        if (balance !== '0.0') {
            return {
                balance,
                rank,
            };
        }
        return {
            balance: '0.0',
        };
    }

    public async getVeBalTotalSupply(): Promise<AmountHumanReadable> {
        if (networkContext.data.veBal) {
            const veBal = await prisma.prismaVeBalTotalSupply.findFirst({
                where: { chain: networkContext.chain },
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
        const veBalHolders: { address: string; balance: string }[] = [];

        let operations: any[] = [];
        let response = {} as Record<string, BigNumber>;

        // for mainnet, we get the vebal balance form the vebal contract
        if (networkContext.isMainnet) {
            const multicall = new Multicaller(networkContext.data.multicall, networkContext.provider, ERC20Abi);

            for (const holder of subgraphVeBalHolders) {
                multicall.call(holder.user, networkContext.data.veBal!.address, 'balanceOf', [holder.user]);

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
                });
            }
        } else {
            //for L2, we get the vebal balance from the delegation proxy
            const multicall = new Multicaller(networkContext.data.multicall, networkContext.provider, VeDelegationAbi);

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
                        userAddress: veBalHolder.address,
                    },
                    update: { balance: veBalHolder.balance },
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

            const veBal = getContractAt(veBalAddress, ERC20Abi);
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
