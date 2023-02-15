import { Chain } from '@prisma/client';
import { BigNumber } from 'ethers';
import { PoolAprService, PoolStakingService } from '../pool/pool-types';
import { UserStakedBalanceService } from '../user/user-types';
import { TokenPriceHandler } from '../token/token-types';
import { BaseProvider } from '@ethersproject/providers';
import { WorkerJob } from '../../worker/manual-jobs';

export interface NetworkConfig {
    data: NetworkData;
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
    beetsPriceProviderRpcUrl: string;
    coingecko: {
        nativeAssetId: string;
        platformId: string;
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
        userBalances: string;
    };
    sanity: {
        projectId: string;
        dataset: string;
    };
    beets: {
        address: string;
    };
    fbeets?: {
        address: string;
        farmId: string;
        reliquaryFarmPid: number;
        poolId: string;
        poolIdV2: string;
        poolAddress: string;
        poolAddressV2: string;
    };
    bal: {
        address: string;
    };
    balancer: {
        vault: string;
        weightedPoolV2Factories: string[];
        composableStablePoolFactories: string[];
        poolsInRecoveryMode: string[];
        yieldProtocolFeePercentage: number;
        swapProtocolFeePercentage: number;
    };
    multicall: string;
    masterchef: {
        address: string;
        excludedFarmIds: string[];
    };
    reliquary?: {
        address: string;
    };
    copper?: {
        proxyAddress: string;
    };
    reaper: {
        linearPoolFactories: string[];
        averageAPRAcrossLastNHarvests: number;
    };
    yearn: {
        vaultsEndpoint: string;
    };
    lido?: {
        wstEthContract: string;
        wstEthAprEndpoint: string;
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
}
