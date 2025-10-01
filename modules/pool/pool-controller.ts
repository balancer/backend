import config from '../../config';
import { createNewPoolsV2 } from './lib/create-new-pools';
import { getV2SubgraphClient } from '../subgraphs/balancer-subgraph';
import { getViemClient } from '../sources/viem-client';
import { prisma } from '../../prisma/prisma-client';
import { updateLiquidityValuesForPools } from './lib/update-liquidity';
import { syncBptBalancesFromSubgraph } from '../actions/user/bpt-balances/helpers/sync-bpt-balances-from-subgraph';
import { EventController } from '../controllers';
import { Chain } from '@prisma/client';
import { poolsWithStateUpdates } from './lib/pool-state-events-v2';
import { syncPoolSnapshotsV2 } from './lib/pool-snapshot-v2';
import { PoolOnChainDataService } from './lib/pool-on-chain-data.service';
import { updateVolumeAndFees } from './lib/update-volume-and-fees';

export function PoolController(tracer?: any) {
    return {
        async syncV2Pools(chain: Chain) {
            const allPoolIds = await prisma.prismaPool.findMany({
                where: { chain, protocolVersion: 2 },
                select: { id: true, address: true },
            });

            const subgraphUrl = config[chain].subgraphs.balancer;
            const subgraphService = getV2SubgraphClient(subgraphUrl, chain);

            const poolsToSync = await EventController().syncEventsV2(chain);
            const poolWithStateChanges = await poolsWithStateUpdates(
                chain,
                allPoolIds.map((p) => p.address),
            );

            //combine both sets
            poolWithStateChanges.forEach((pool) => poolsToSync.add(pool));

            if (poolsToSync.size === 0) {
                return [];
            }

            // find missing pools and add them (newly added pools will have an add liquidity event on init)
            const missingPoolIds = allPoolIds.filter((pool) => !poolsToSync.has(pool.id)).map((p) => p.id);
            await createNewPoolsV2(subgraphService, chain, missingPoolIds);

            // always sync LBP pools
            // This might get slow on GNOSIS, because of the Circle pools
            const lbps = await prisma.prismaPool.findMany({
                where: {
                    chain,
                    type: 'LIQUIDITY_BOOTSTRAPPING',
                    protocolVersion: 2,
                },
                select: { id: true },
            });
            lbps.forEach((pool) => poolsToSync.add(pool.id));

            // sync onchain data for the changed pools
            await this.syncOnchainDataForPoolsV2(chain, Array.from(poolsToSync));

            // sync user bpt shares for the changed pools
            await syncBptBalancesFromSubgraph(Array.from(poolsToSync), subgraphService, chain);

            // sync tvl for the changed pools
            await updateLiquidityValuesForPools(chain, Array.from(poolsToSync));

            // update volume and fees for the changed pools
            await updateVolumeAndFees(chain, Array.from(poolsToSync));

            // update snapshots for changed pools
            await syncPoolSnapshotsV2(chain, Array.from(poolsToSync));
        },
        async syncOnchainDataForPoolsV2(chain: Chain, poolIds?: string[]) {
            const vaultAddress = config[chain].balancer.v2.vaultAddress;
            const balancerQueriesAddress = config[chain].balancer.v2.balancerQueriesAddress;
            const yieldProtocolFeePercentage = config[chain].balancer.v2.defaultYieldFeePercentage;
            const swapProtocolFeePercentage = config[chain].balancer.v2.defaultSwapFeePercentage;
            const gyroConfig = config[chain].gyro?.config;

            const viemClient = getViemClient(chain);
            const latestBlock = await viemClient.getBlockNumber();

            const poolOnChainDataService = new PoolOnChainDataService(() => ({
                vaultAddress,
                balancerQueriesAddress,
                yieldProtocolFeePercentage,
                swapProtocolFeePercentage,
                gyroConfig,
            }));

            const tokenPrices = await prisma.prismaTokenCurrentPrice.findMany({
                where: {
                    chain,
                },
            });

            await poolOnChainDataService.updateOnChainStatus(chain, poolIds);
            await poolOnChainDataService.updateOnChainData(chain, Number(latestBlock), tokenPrices, poolIds);
        },
    };
}
