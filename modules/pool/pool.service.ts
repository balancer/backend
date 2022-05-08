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
import { GqlPoolTokenUnion, GqlPoolUnion, QueryPoolGetPoolsArgs } from '../../schema';
import { PoolGqlLoaderService } from './src/pool-gql-loader.service';
import { PoolSanityDataLoaderService } from './src/pool-sanity-data-loader.service';
import { PoolAprUpdaterService } from './src/pool-apr-updater.service';
import { SwapFeeAprService } from './apr-data-sources/swap-fee-apr.service';
import { MasterchefFarmAprService } from './apr-data-sources/masterchef-farm-apr.service';
import { SpookySwapAprService } from './apr-data-sources/spooky-swap-apr.service';
import { YearnVaultAprService } from './apr-data-sources/yearn-vault-apr.service';

export class PoolService {
    constructor(
        private readonly provider: Provider,
        private readonly poolLoaderService: PoolCreatorService,
        private readonly poolOnChainDataService: PoolOnChainDataService,
        private readonly poolUsdDataService: PoolUsdDataService,
        private readonly poolGqlLoaderService: PoolGqlLoaderService,
        private readonly poolSanityDataLoaderService: PoolSanityDataLoaderService,
        private readonly poolAprUpdaterService: PoolAprUpdaterService,
    ) {}

    public async getGqlPool(id: string): Promise<GqlPoolUnion> {
        return this.poolGqlLoaderService.getPool(id);
    }

    public async getGqlPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolUnion[]> {
        return this.poolGqlLoaderService.getPools(args);
    }

    public async syncAllPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await this.provider.getBlockNumber();

        return this.poolLoaderService.syncAllPoolsFromSubgraph(blockNumber);
    }

    public async syncNewPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await this.provider.getBlockNumber();

        return this.poolLoaderService.syncNewPoolsFromSubgraph(blockNumber);
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

    public async updateOnChainDataForPools(poolIds: string[], blockNumber: number) {
        await this.poolOnChainDataService.updateOnChainData(poolIds, this.provider, blockNumber);
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

    public async updateVolumeAndFeeValuesForPools(poolIds?: string[]): Promise<void> {
        console.time('updateVolumeAndFeeValuesForPools');
        await this.poolUsdDataService.updateVolumeAndFeeValuesForPools(poolIds);
        console.timeEnd('updateVolumeAndFeeValuesForPools');
    }

    public async syncSwapsForLast24Hours(): Promise<string[]> {
        console.time('syncSwapsForLast24Hours');
        const poolIds = await this.poolUsdDataService.syncSwapsForLast24Hours();
        console.timeEnd('syncSwapsForLast24Hours');

        return poolIds;
    }

    public async syncSanityPoolData() {
        await this.poolSanityDataLoaderService.syncPoolSanityData();
    }

    public async updatePoolAprs() {
        await this.poolAprUpdaterService.updatePoolAprs();
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
    new PoolGqlLoaderService(tokenPriceService),
    new PoolSanityDataLoaderService(),
    //TODO: this will depend on the chain
    new PoolAprUpdaterService([
        new SwapFeeAprService(),
        new MasterchefFarmAprService(),
        new SpookySwapAprService(tokenPriceService),
        new YearnVaultAprService(tokenPriceService),
    ]),
);
