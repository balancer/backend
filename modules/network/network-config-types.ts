import { Chain } from '@prisma/client';
import { BigNumber } from 'ethers';
import { PoolAprService, PoolStakingService } from '../pool/pool-types';
import { UserStakedBalanceService } from '../user/user-types';
import { TokenPriceHandler } from '../token/token-types';
import { BaseProvider } from '@ethersproject/providers';
import { GqlChain } from '../../schema';
import { ContentService } from '../content/content-types';
import { YbAprConfig } from './apr-config-types';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';
import { SftmxSubgraphService } from '../subgraphs/sftmx-subgraph/sftmx.service';

export interface NetworkConfig {
    data: NetworkData;
    contentService: ContentService;
    poolStakingServices: PoolStakingService[];
    poolAprServices: PoolAprService[];
    userStakedBalanceServices: UserStakedBalanceService[];
    tokenPriceHandlers: TokenPriceHandler[];
    provider: BaseProvider;
    workerJobs: WorkerJob[];
    services: NetworkServices;
}

interface NetworkServices {
    balancerSubgraphService: BalancerSubgraphService;
    sftmxSubgraphService?: SftmxSubgraphService;
}

export interface WorkerJob {
    name: string;
    interval: number;
    alarmEvaluationPeriod?: number;
    alarmDatapointsToAlarm?: number;
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
    coingecko: {
        nativeAssetId: string;
        platformId: string;
        excludedTokenAddresses: string[];
    };
    subgraphs: {
        startDate: string;
        balancer: string;
        blocks: string;
        masterchef?: string;
        reliquary?: string;
        sftmx?: string;
        beetsBar?: string;
        gauge?: string;
        veBalLocks?: string;
        userBalances: string;
    };
    protocolToken: 'beets' | 'bal';
    beets?: {
        address: string;
        beetsPriceProviderRpcUrl: string;
    };
    fbeets?: {
        address: string;
        farmId: string;
        poolId: string;
        poolAddress: string;
    };
    sftmx?: {
        stakingContractAddress: string;
        sftmxAddress: string;
    };
    bal?: {
        address: string;
    };
    veBal?: {
        address: string;
        delegationProxy: string;
    };
    gaugeControllerAddress?: string;
    gaugeControllerHelperAddress?: string;
    gyro?: {
        config: string;
    };
    balancer: {
        v2: {
            vault: string;
            tokenAdmin?: string;
            yieldProtocolFeePercentage: number;
            swapProtocolFeePercentage: number;
        };
        v3: {
            vault: string;
            tokenAdmin?: string;
            yieldProtocolFeePercentage: number;
            swapProtocolFeePercentage: number;
        };
    };
    multicall: string;
    multicall3: string;
    masterchef?: {
        address: string;
        excludedFarmIds: string[];
    };
    ybAprConfig: YbAprConfig;
    reliquary?: {
        address: string;
        excludedFarmIds: string[];
    };
    copper?: {
        proxyAddress: string;
    };
    beefy?: {
        linearPools: string[];
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
            poolIdsToExclude: string[];
        };
    };
    datastudio?: {
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
