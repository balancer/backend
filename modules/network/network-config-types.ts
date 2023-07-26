import { Chain } from '@prisma/client';
import { BigNumber } from 'ethers';
import { PoolAprService, PoolStakingService } from '../pool/pool-types';
import { UserStakedBalanceService } from '../user/user-types';
import { TokenPriceHandler } from '../token/token-types';
import { BaseProvider } from '@ethersproject/providers';
import { GqlChain } from '../../schema';
import { ContentService } from '../content/content-types';
import { WorkerJob } from '../../worker/job-handlers';

export interface NetworkConfig {
    data: NetworkData;
    contentService: ContentService;
    poolStakingServices: PoolStakingService[];
    poolAprServices: PoolAprService[];
    userStakedBalanceServices: UserStakedBalanceService[];
    tokenPriceHandlers: TokenPriceHandler[];
    provider: BaseProvider;
    workerJobs: WorkerJob[];
}

export type DeploymentEnv = 'canary' | 'main';

export interface NetworkData {
    chain: {
        slug: string;
        id: number;
        nativeAssetAddress: string;
        wrappedNativeAssetAddress: string;
        prismaId: Chain;
        gqlId: GqlChain;
    };
    eth: {
        address: string;
        addressFormatted: string;
        symbol: string;
        name: string;
    };
    weth: {
        address: string;
        addressFormatted: string;
    };
    rpcUrl: string;
    rpcMaxBlockRange: number;
    beetsPriceProviderRpcUrl: string;
    coingecko: {
        nativeAssetId: string;
        platformId: string;
        excludedTokenAddresses: string[];
    };
    tokenPrices: {
        maxHourlyPriceHistoryNumDays: number;
    };
    subgraphs: {
        startDate: string;
        balancer: string;
        blocks: string;
        masterchef?: string;
        reliquary?: string;
        beetsBar?: string;
        gauge?: string;
        veBalLocks?: string;
        userBalances: string;
    };
    sanity: {
        projectId: string;
        dataset: string;
    };
    protocolToken: 'beets' | 'bal';
    beets: {
        address: string;
    };
    fbeets?: {
        address: string;
        farmId: string;
        poolId: string;
        poolAddress: string;
    };
    bal: {
        address: string;
    };
    veBal?: {
        address: string;
        delegationProxy: string;
    };
    gaugeControllerAddress?: string;
    balancer: {
        vault: string;
        weightedPoolV2Factories: string[];
        composableStablePoolFactories: string[];
        yieldProtocolFeePercentage: number;
        swapProtocolFeePercentage: number;
        poolDataQueryContract: string;
        excludedPoolDataQueryPoolIds?: string[];
        factoriesWithpoolSpecificProtocolFeePercentagesProvider?: string[];
    };
    multicall: string;
    multicall3: string;
    masterchef: {
        address: string;
        excludedFarmIds: string[];
    };
    reliquary?: {
        address: string;
        excludedFarmIds: string[];
    };
    copper?: {
        proxyAddress: string;
    };
    reaper: {
        linearPoolFactories: string[];
        linearPoolIdsFromErc4626Factory: string[];
        averageAPRAcrossLastNHarvests: number;
        multistratAprSubgraphUrl: string;
    };
    beefy: {
        linearPools: string[];
    };
    yearn: {
        vaultsEndpoint: string;
    };
    lido?: {
        wstEthContract: string;
        wstEthAprEndpoint: string;
    };
    stader?: {
        sFtmxContract: string;
    };
    rocket?: {
        rEthContract: string;
    };
    spooky?: {
        xBooContract: string;
    };
    ankr?: {
        ankrFtmContract: string;
        ankrEthContract: string;
    };
    overnight?: {
        aprEndpoint: string;
    };
    avgBlockSpeed: number;
    sor: {
        [key in DeploymentEnv]: {
            url: string;
            maxPools: number;
            forceRefresh: boolean;
            gasPrice: BigNumber;
            swapGas: BigNumber;
        };
    };
    datastudio: {
        [key in DeploymentEnv]: {
            user: string;
            sheetId: string;
            compositionTabName: string;
            databaseTabName: string;
            emissionDataTabName: string;
        };
    };
    monitoring: {
        [key in DeploymentEnv]: {
            alarmTopicArn: string;
        };
    };
}
