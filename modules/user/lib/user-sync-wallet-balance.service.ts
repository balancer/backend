import { zeroAddress as AddressZero } from 'viem';
import _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { prismaBulkExecuteOperations } from '../../../prisma/prisma-util';
import { AllNetworkConfigsKeyedOnChain } from '../../network/network-config';
import { Chain, Prisma } from '@prisma/client';

export class UserSyncWalletBalanceService {
    public async initBalancesForPool(poolId: string, chain: Chain) {
        const networkConfig = AllNetworkConfigsKeyedOnChain[chain];
        const blockNumber = await networkConfig.services.balancerSubgraphService.lastSyncedBlock();

        const shares = await networkConfig.services.balancerSubgraphService.getAllPoolSharesWithBalance(
            [poolId],
            [AddressZero],
        );

        await prismaBulkExecuteOperations(
            [
                prisma.prismaUser.createMany({
                    data: shares.map((share) => ({ address: share.userAddress })),
                    skipDuplicates: true,
                }),
                ...shares.map((share) => this.getPrismaUpsertForPoolShare(share, chain)),
                prisma.prismaUserBalanceSyncStatus.upsert({
                    where: { type_chain: { type: 'WALLET', chain } },
                    create: { type: 'WALLET', chain, blockNumber },
                    update: { blockNumber },
                }),
            ],
            true,
        );
    }

    private getPrismaUpsertForPoolShare(share: Prisma.PrismaUserWalletBalanceCreateManyInput, chain: Chain) {
        return prisma.prismaUserWalletBalance.upsert({
            where: { id_chain: { id: `${share.tokenAddress}-${share.userAddress}`, chain } },
            create: {
                ...share,
                id: `${share.tokenAddress}-${share.userAddress}`,
                chain,
            },
            update: { balance: share.balance, balanceNum: share.balanceNum },
        });
    }
}
