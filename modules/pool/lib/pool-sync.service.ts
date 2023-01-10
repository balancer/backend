import * as _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { PrismaLastBlockSyncedCategory } from '@prisma/client';
import { poolService } from '../pool.service';
import { getContractAt, jsonRpcProvider } from '../../web3/contract';
import { networkConfig } from '../../config/network-config';
import VaultAbi from '../abi/Vault.json';

export class PoolSyncService {
    public async syncChangedPools() {
        let lastSync = await prisma.prismaLastBlockSynced.findUnique({
            where: { category: PrismaLastBlockSyncedCategory.POOLS },
        });
        const lastSyncBlock = lastSync?.blockNumber ?? 0;
        const latestBlock = await jsonRpcProvider.getBlockNumber();

        const startBlock = lastSyncBlock + 1;
        const endBlock = latestBlock - startBlock > 2_000 ? startBlock + 2_000 : latestBlock;

        const contract = getContractAt(networkConfig.balancer.vault, VaultAbi);

        const events = await contract.queryFilter({ address: networkConfig.balancer.vault }, startBlock, endBlock);
        const filteredEvents = events.filter((event) =>
            ['PoolBalanceChanged', 'PoolBalanceManaged', 'Swap'].includes(event.event!),
        );
        const poolIds: string[] = _.uniq(filteredEvents.map((event) => event.args!.poolId));
        if (poolIds.length !== 0) {
            console.log(`Syncing ${poolIds.length} pools`);
            await poolService.updateOnChainDataForPools(poolIds, endBlock);

            const poolsWithNewSwaps = await poolService.syncSwapsForLast48Hours();
            await poolService.updateVolumeAndFeeValuesForPools(poolsWithNewSwaps);
        }

        await prisma.prismaLastBlockSynced.upsert({
            where: { category: PrismaLastBlockSyncedCategory.POOLS },
            update: {
                blockNumber: endBlock,
            },
            create: {
                category: PrismaLastBlockSyncedCategory.POOLS,
                blockNumber: endBlock,
            },
        });
    }
}
