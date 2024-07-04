import { UserStakedBalanceService, UserSyncUserBalanceInput } from '../user-types';
import { prisma } from '../../../prisma/prisma-client';
import { getContractAt } from '../../web3/contract';
import _ from 'lodash';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import RewardsOnlyGaugeAbi from './abi/RewardsOnlyGauge.json';
import { Multicaller } from '../../web3/multicaller';
import { formatFixed } from '@ethersproject/bignumber';
import { PrismaPoolStakingType } from '@prisma/client';
import { networkContext } from '../../network/network-context.service';
import { GaugeSubgraphService } from '../../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { veBalLocksSubgraphService } from '../../subgraphs/veBal-locks-subgraph/veBal-locks-subgraph.service';
import { BigNumber } from 'ethers';
import VeBalABI from '../../vebal/abi/vebal.json';
import mainnet from '../../../config/mainnet';

export class UserSyncVebalLockBalanceService implements UserStakedBalanceService {
    get chain() {
        return networkContext.chain;
    }

    private readonly veBalPoolId = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';

    public async initStakedBalances(stakingTypes: PrismaPoolStakingType[]): Promise<void> {
        if (!stakingTypes.includes('VEBAL') && this.chain !== 'MAINNET') {
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
        const metadata = await veBalLocksSubgraphService.getMetadata();

        let operations: any[] = [];
        // for mainnet, we get the vebal balance form the vebal contract
        const multicall = new Multicaller(networkContext.data.multicall, networkContext.provider, VeBalABI);

        let response = {} as {
            [userAddress: string]: {
                balance: BigNumber;
                locked: BigNumber[];
            };
        };

        for (const holder of subgraphVeBalHolders) {
            multicall.call(`${holder.user}.locked`, networkContext.data.veBal!.address, 'locked', [holder.user]);

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
                prisma.prismaUserStakedBalance.deleteMany({ where: { staking: { type: 'VEBAL' }, chain: this.chain } }),
            );
        }

        for (const veBalHolder in response) {
            operations.push(
                prisma.prismaUserStakedBalance.upsert({
                    where: { id_chain: { id: `veBal-${veBalHolder.toLowerCase()}`, chain: 'MAINNET' } },
                    create: {
                        id: `veBal-${veBalHolder.toLowerCase()}`,
                        chain: 'MAINNET',
                        balance: formatFixed(response[veBalHolder].locked[0], 18),
                        balanceNum: parseFloat(formatFixed(response[veBalHolder].locked[0], 18)),
                        userAddress: veBalHolder.toLowerCase(),
                        poolId: this.veBalPoolId,
                        tokenAddress: mainnet.veBal!.bptAddress,
                        stakingId: mainnet.veBal!.address,
                    },
                    update: {
                        balance: formatFixed(response[veBalHolder].locked[0], 18),
                        balanceNum: parseFloat(formatFixed(response[veBalHolder].locked[0], 18)),
                    },
                }),
            );
        }

        operations.push(
            prisma.prismaUserBalanceSyncStatus.upsert({
                where: { type_chain: { type: 'VEBAL', chain: this.chain } },
                create: { type: 'VEBAL', chain: this.chain, blockNumber: metadata.block.number },
                update: { blockNumber: metadata.block.number },
            }),
        );
        await prismaBulkExecuteOperations(operations, true, undefined);
    }

    public async syncUserBalance({ userAddress, poolId, poolAddress, staking }: UserSyncUserBalanceInput) {}
}
