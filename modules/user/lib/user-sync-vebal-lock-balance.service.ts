import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { formatFixed } from '@ethersproject/bignumber';
import { Chain, PrismaPoolStakingType } from '@prisma/client';
import { veBalLocksSubgraphService } from '../../subgraphs/veBal-locks-subgraph/veBal-locks-subgraph.service';
import { BigNumber } from 'ethers';
import VeBalABI from '../../vebal/abi/vebal.json';
import mainnet from '../../../config/mainnet';
import { Multicaller3Viem } from '../../web3/multicaller-viem';

export class UserSyncVebalLockBalanceService implements UserStakedBalanceService {
    private readonly veBalPoolId = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
    private chain: Chain = 'MAINNET';

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (!stakingTypes.includes('VEBAL')) {
            return;
        }

        console.log('initStakedVebalBalances: Starting loading users and onchain balances...');
        await this.syncBalances(true);

        console.log('initStakedVebalBalances: finished...');
    }

    public async syncChangedStakedBalances(): Promise<void> {
        await this.syncBalances(false);
    }

    private async syncBalances(init: boolean): Promise<void> {
        const subgraphVeBalHolders = await veBalLocksSubgraphService.getAllveBalHolders();
        const blockNumber = await veBalLocksSubgraphService.lastSyncedBlock();

        let operations: any[] = [];
        // for mainnet, we get the vebal balance form the vebal contract
        const multicall = new Multicaller3Viem('MAINNET', VeBalABI);

        let response = {} as {
            [userAddress: string]: {
                balance: BigNumber;
                locked: {
                    amount: BigNumber;
                    end: BigNumber;
                };
            };
        };

        for (const holder of subgraphVeBalHolders) {
            multicall.call(`${holder.user}.locked`, mainnet.veBal!.address, 'locked', [holder.user]);

            // so if we scheduled more than 100 calls, we execute the batch
            if (multicall.numCalls >= 100) {
                response = _.merge(response, await multicall.execute());
            }
        }

        if (multicall.numCalls > 0) {
            response = _.merge(response, await multicall.execute());
        }

        operations.push(
            prisma.prismaUser.createMany({
                data: subgraphVeBalHolders.map((holder) => ({ address: holder.user.toLowerCase() })),
                skipDuplicates: true,
            }),
        );

        if (init) {
            operations.push(
                prisma.prismaUserStakedBalance.deleteMany({ where: { staking: { type: 'VEBAL' }, chain: 'MAINNET' } }),
            );
        }

        for (const veBalHolder in response) {
            operations.push(
                prisma.prismaUserStakedBalance.upsert({
                    where: { id_chain: { id: `veBal-${veBalHolder.toLowerCase()}`, chain: 'MAINNET' } },
                    create: {
                        id: `veBal-${veBalHolder.toLowerCase()}`,
                        chain: 'MAINNET',
                        balance: formatFixed(response[veBalHolder].locked.amount, 18),
                        balanceNum: parseFloat(formatFixed(response[veBalHolder].locked.amount, 18)),
                        userAddress: veBalHolder.toLowerCase(),
                        poolId: this.veBalPoolId,
                        tokenAddress: mainnet.veBal!.bptAddress,
                        stakingId: mainnet.veBal!.address,
                    },
                    update: {
                        balance: formatFixed(response[veBalHolder].locked.amount, 18),
                        balanceNum: parseFloat(formatFixed(response[veBalHolder].locked.amount, 18)),
                    },
                }),
            );
        }

        operations.push(
            prisma.prismaUserBalanceSyncStatus.upsert({
                where: { type_chain: { type: 'VEBAL', chain: 'MAINNET' } },
                create: { type: 'VEBAL', chain: 'MAINNET', blockNumber },
                update: { blockNumber },
            }),
        );
        await prismaBulkExecuteOperations(operations, true, undefined);
    }

    public async syncUserBalance({ userAddress, poolId, poolAddress, staking }: UserSyncUserBalanceInput) {}
}
