import { PoolCreatorService } from './src/pool-creator.service';
import { blocksSubgraphService } from '../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { PoolOnChainDataService } from './src/pool-on-chain-data.service';
import { env } from '../../app/env';
import { BALANCER_NETWORK_CONFIG } from '../balancer/src/contracts';
import { prisma } from '../util/prisma-client';
import { providers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import _ from 'lodash';
import { PoolUsdDataService } from './src/pool-usd-data.service';

export class PoolService {
    constructor(
        private readonly provider: Provider,
        private readonly poolLoaderService: PoolCreatorService,
        private readonly poolOnChainDataService: PoolOnChainDataService,
        private readonly poolUsdDataService: PoolUsdDataService,
    ) {}

    public async syncAllPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await blocksSubgraphService.getLatestBlock();

        return this.poolLoaderService.syncAllPoolsFromSubgraph(blockNumber);
    }

    public async loadOnChainDataForAllPools(): Promise<void> {
        const result = await prisma.prismaPool.findMany({ select: { id: true } });
        const poolIds = result.map((item) => item.id);
        const blockNumber = await blocksSubgraphService.getLatestBlock();

        const chunks = _.chunk(poolIds, 100);

        for (const chunk of chunks) {
            await this.poolOnChainDataService.updateOnChainData(chunk, this.provider, blockNumber);
        }
    }

    public async updateLiquidityValuesForAllPools(): Promise<void> {
        await this.poolUsdDataService.updateLiquidityValuesForAllPools();
    }
}

export const poolService = new PoolService(
    new providers.JsonRpcProvider(env.RPC_URL),
    new PoolCreatorService(),
    new PoolOnChainDataService(
        BALANCER_NETWORK_CONFIG[env.CHAIN_ID].multicall,
        BALANCER_NETWORK_CONFIG[env.CHAIN_ID].vault,
    ),
    new PoolUsdDataService(),
);
