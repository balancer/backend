import { Chain, PrismaPoolType } from '@prisma/client';
import { getViemClient } from '../sources/viem-client';
import { syncData } from '../actions/lbp/sync-data';
import config from '../../config';
import { syncDataFixedLBP } from '../actions/lbp/sync-data-fixedLBP';
import { prisma } from '../../prisma/prisma-client';
import { syncPools } from '../actions/pool/v3/sync-pools';
import { PoolWithMappedJsonFields } from '../../prisma/prisma-types';

export const LBPController = {
    async syncData(chain: Chain) {
        const client = getViemClient(chain);
        const vaultAddress = config[chain].balancer.v3.vaultAddress;
        if (!vaultAddress) return;

        await syncData(chain, client, vaultAddress);
    },
    async syncDataFixedLBP(chain: Chain) {
        const client = getViemClient(chain);

        await syncDataFixedLBP(chain, client);
    },
    async reloadLbps(chain: Chain) {
        const lbps = (await prisma.prismaPool.findMany({
            where: {
                chain,
                type: 'LIQUIDITY_BOOTSTRAPPING',
                protocolVersion: 3,
            },
            select: { id: true, type: true, version: true, hook: true, typeData: true },
        })) as PoolWithMappedJsonFields[];

        const viemClient = getViemClient(chain);
        const latestBlock = await viemClient.getBlockNumber();

        await syncPools(lbps, chain, config[chain].balancer.v3.vaultAddress, viemClient, Number(latestBlock));

        await this.syncData(chain);
    },
    async reloadFixedLbps(chain: Chain) {
        const lbps = (await prisma.prismaPool.findMany({
            where: {
                chain,
                type: 'FIXED_LBP',
                protocolVersion: 3,
            },
            select: { id: true, type: true, version: true, hook: true, typeData: true },
        })) as PoolWithMappedJsonFields[];

        const viemClient = getViemClient(chain);
        const latestBlock = await viemClient.getBlockNumber();

        await syncPools(lbps, chain, config[chain].balancer.v3.vaultAddress, viemClient, Number(latestBlock));

        await this.syncDataFixedLBP(chain);
    },
};
