import * as _ from 'lodash';
import { prisma } from '../../../prisma/prisma-client';
import { Chain, PrismaLastBlockSyncedCategory } from '@prisma/client';
import { poolService } from '../pool.service';
import VaultAbi from '../abi/Vault.json';
import { networkContext } from '../../network/network-context.service';
import { getEvents } from '../../web3/events';

export class PoolSyncService {
    get chain(): Chain {
        return networkContext.chain;
    }

    get chainId(): string {
        return networkContext.chainId;
    }

    get provider() {
        return networkContext.provider;
    }

    get vaultAddress() {
        return networkContext.data.balancer.vault;
    }

    get rpcUrl() {
        return networkContext.data.rpcUrl;
    }

    get rpcMaxBlockRange() {
        return networkContext.data.rpcMaxBlockRange;
    }

    public async syncChangedPools() {
        let lastSync = await prisma.prismaLastBlockSynced.findUnique({
            where: { category_chain: { category: PrismaLastBlockSyncedCategory.POOLS, chain: this.chain } },
        });
        const lastSyncBlock = lastSync?.blockNumber ?? 0;
        const latestBlock = await this.provider.getBlockNumber();

        const startBlock = lastSyncBlock + 1;
        const endBlock = latestBlock;

        // no new blocks have been minted, needed for slow networks
        if (startBlock > endBlock) {
            return;
        }

        // Update status for all the pools
        const allPools = await prisma.prismaPool.findMany({
            where: { chain: this.chain },
        });
        await poolService.updateOnChainStatusForPools(allPools.map((pool) => pool.id));

        // Get state changing events from the vault contract
        const filteredEvents = await getEvents(
            startBlock,
            endBlock,
            [this.vaultAddress],
            ['PoolBalanceChanged', 'PoolBalanceManaged', 'Swap'],
            this.rpcUrl,
            this.rpcMaxBlockRange,
            VaultAbi,
        );

        console.log(`sync-changed-pools-${this.chainId} found ${filteredEvents.length} events`);

        const poolIds: string[] = _.uniq(filteredEvents.map((event) => event.args!.poolId));
        if (poolIds.length !== 0) {
            console.log(`Syncing ${poolIds.length} pools between blocks ${startBlock} and ${endBlock}`);
            await poolService.updateOnChainDataForPools(poolIds, endBlock);

            const poolsWithNewSwaps = await poolService.syncSwapsForLast48Hours();
            await poolService.updateVolumeAndFeeValuesForPools(poolsWithNewSwaps);
        }

        await prisma.prismaLastBlockSynced.upsert({
            where: { category_chain: { category: PrismaLastBlockSyncedCategory.POOLS, chain: this.chain } },
            update: {
                blockNumber: endBlock,
            },
            create: {
                category: PrismaLastBlockSyncedCategory.POOLS,
                blockNumber: endBlock,
                chain: this.chain,
            },
        });
    }

    public async initOnChainDataForAllPools() {
        const latestBlock = await this.provider.getBlockNumber();

        const allPools = await prisma.prismaPool.findMany({
            where: { chain: this.chain },
        });

        const poolIds = allPools.map((pool) => pool.id);

        await poolService.updateOnChainStatusForPools(poolIds);

        console.log(`Init syncing ${poolIds.length} pools up to block ${latestBlock}`);
        await poolService.updateOnChainDataForPools(poolIds, latestBlock);
        await poolService.syncSwapsForLast48Hours();
        await poolService.updateVolumeAndFeeValuesForPools(poolIds);

        await prisma.prismaLastBlockSynced.upsert({
            where: { category_chain: { category: PrismaLastBlockSyncedCategory.POOLS, chain: this.chain } },
            update: {
                blockNumber: latestBlock,
            },
            create: {
                category: PrismaLastBlockSyncedCategory.POOLS,
                blockNumber: latestBlock,
                chain: this.chain,
            },
        });
    }

    public async setPoolsWithPreferredGaugesAsIncentivized() {
        const poolsWithGauges = await prisma.prismaPool.findMany({
            include: { staking: true },
            where: {
                staking: {
                    some: {
                        gauge: { status: 'PREFERRED' },
                    },
                },
            },
        });

        await prisma.prismaPoolCategory.createMany({
            data: poolsWithGauges.map((pool) => ({
                id: `${this.chain}-${pool.id}-INCENTIVIZED`,
                poolId: pool.id,
                category: 'INCENTIVIZED' as const,
                chain: this.chain,
            })),
            skipDuplicates: true,
        });

        await prisma.prismaPoolCategory.deleteMany({
            where: {
                category: 'INCENTIVIZED',
                chain: this.chain,
                poolId: {
                    notIn: poolsWithGauges.map((pool) => pool.id),
                },
            },
        });
    }
}
