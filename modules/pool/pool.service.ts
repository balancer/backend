import { PoolCreatorService } from './src/pool-creator.service';
import { PoolOnChainDataService } from './src/pool-on-chain-data.service';
import { env } from '../../app/env';
import { BALANCER_NETWORK_CONFIG } from '../balancer/src/contracts';
import { prisma } from '../util/prisma-client';
import { providers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import _ from 'lodash';
import { PoolUsdDataService } from './src/pool-usd-data.service';
import { tokenPriceService } from '../token-price/token-price.service';
import { balancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import moment from 'moment-timezone';

export class PoolService {
    constructor(
        private readonly provider: Provider,
        private readonly poolLoaderService: PoolCreatorService,
        private readonly poolOnChainDataService: PoolOnChainDataService,
        private readonly poolUsdDataService: PoolUsdDataService,
    ) {}

    public async syncAllPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await this.provider.getBlockNumber();

        return this.poolLoaderService.syncAllPoolsFromSubgraph(blockNumber);
    }

    public async loadOnChainDataForAllPools(): Promise<void> {
        const result = await prisma.prismaPool.findMany({ select: { id: true } });
        const poolIds = result.map((item) => item.id);
        const blockNumber = await this.provider.getBlockNumber();

        const chunks = _.chunk(poolIds, 100);

        for (const chunk of chunks) {
            await this.poolOnChainDataService.updateOnChainData(chunk, this.provider, blockNumber);
        }
    }

    public async loadOnChainDataForPoolsWithActiveUpdates() {
        const blockNumber = await this.provider.getBlockNumber();
        const timestamp = moment().subtract(5, 'minutes').unix();
        console.time('getPoolsWithActiveUpdates');
        const poolIds = await balancerSubgraphService.getPoolsWithActiveUpdates(timestamp);
        console.timeEnd('getPoolsWithActiveUpdates');

        console.time('updateOnChainData');
        await this.poolOnChainDataService.updateOnChainData(poolIds, this.provider, blockNumber);
        console.timeEnd('updateOnChainData');
    }

    public async updateLiquidityValuesForAllPools(): Promise<void> {
        await this.poolUsdDataService.updateLiquidityValuesForAllPools();
    }

    public async updateVolumeAndFeeValuesForAllPools(): Promise<void> {
        console.time('updateVolumeAndFeeValuesForAllPools');
        await this.poolUsdDataService.updateVolumeAndFeeValuesForAllPools();
        console.timeEnd('updateVolumeAndFeeValuesForAllPools');
    }

    public async syncSwapsForLast24Hours(): Promise<void> {
        console.time('syncSwapsForLast24Hours');
        await this.poolUsdDataService.syncSwapsForLast24Hours();
        console.timeEnd('syncSwapsForLast24Hours');
    }
}

export const poolService = new PoolService(
    new providers.JsonRpcProvider(env.RPC_URL),
    new PoolCreatorService(),
    new PoolOnChainDataService(
        BALANCER_NETWORK_CONFIG[env.CHAIN_ID].multicall,
        BALANCER_NETWORK_CONFIG[env.CHAIN_ID].vault,
        tokenPriceService,
    ),
    new PoolUsdDataService(tokenPriceService, balancerSubgraphService),
);
