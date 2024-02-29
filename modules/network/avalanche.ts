import { BigNumber, ethers } from 'ethers';
import { DeploymentEnv, NetworkConfig, NetworkData } from './network-config-types';
import { tokenService } from '../token/token.service';
import { PhantomStableAprService } from '../pool/lib/apr-data-sources/phantom-stable-apr.service';
import { BoostedPoolAprService } from '../pool/lib/apr-data-sources/boosted-pool-apr.service';
import { SwapFeeAprService } from '../pool/lib/apr-data-sources/swap-fee-apr.service';
import { GaugeAprService } from '../pool/lib/apr-data-sources/ve-bal-gauge-apr.service';
import { GaugeStakingService } from '../pool/lib/staking/gauge-staking.service';
import { UserSyncGaugeBalanceService } from '../user/lib/user-sync-gauge-balance.service';
import { every } from '../../worker/intervals';
import { GithubContentService } from '../content/github-content.service';
import { gaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { env } from '../../app/env';
import { YbTokensAprService } from '../pool/lib/apr-data-sources/yb-tokens-apr.service';
import { BalancerSubgraphService } from '../subgraphs/balancer-subgraph/balancer-subgraph.service';

const avalancheNetworkData: NetworkData = {
    chain: {
        slug: 'avalanche',
        id: 43114,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        prismaId: 'AVALANCHE',
        gqlId: 'AVALANCHE',
    },
    subgraphs: {
        startDate: '2023-06-06',
        balancer: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-avalanche-v2',
        beetsBar: 'https://',
        blocks: 'https://api.thegraph.com/subgraphs/name/iliaazhel/avalanche-blocks',
        gauge: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges-avalanche',
        veBalLocks: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges',
        userBalances: 'https://',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'AVAX',
        name: 'Avax',
    },
    weth: {
        address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
        addressFormatted: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    },
    coingecko: {
        nativeAssetId: 'avalanche-2',
        platformId: 'avalanche',
        excludedTokenAddresses: [],
    },
    rpcUrl:
        env.INFURA_API_KEY && (env.DEPLOYMENT_ENV as DeploymentEnv) === 'main'
            ? `https://avalanche-mainnet.infura.io/v3/${env.INFURA_API_KEY}`
            : 'https://rpc.ankr.com/avalanche',
    rpcMaxBlockRange: 2000,
    protocolToken: 'bal',
    bal: {
        address: '0xe15bcb9e0ea69e6ab9fa080c4c4a5632896298c3',
    },
    veBal: {
        address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
        delegationProxy: '0x0c6052254551eae3ecac77b01dfcf1025418828f',
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '0xe39b5e3b6d74016b2f6a9673d7d7493b6df549d5',
        },
        v3: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
        },
    },
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 2,
    ybAprConfig: {
        aave: {
            v3: {
                subgraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-avalanche',
                tokens: {
                    USDC: {
                        underlyingAssetAddress: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
                        aTokenAddress: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
                        wrappedTokens: {
                            stataAvaUSDC: '0xe7839ea8ea8543c7f5d9c9d7269c661904729fe7',
                        },
                    },
                    USDT: {
                        underlyingAssetAddress: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
                        aTokenAddress: '0x6ab707aca953edaefbc4fd23ba73294241490620',
                        wrappedTokens: {
                            stataAvaUSDT: '0x759a2e28d4c3ad394d3125d5ab75a6a5d6782fd9',
                        },
                    },
                    DAI: {
                        underlyingAssetAddress: '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
                        aTokenAddress: '0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee',
                        wrappedTokens: {
                            stataAvaDAI: '0x234c4b76f749dfffd9c18ea7cc0972206b42d019',
                        },
                    },
                    wETH: {
                        underlyingAssetAddress: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
                        aTokenAddress: '0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8',
                        wrappedTokens: {
                            stataAvaWETH: '0x41bafe0091d55378ed921af3784622923651fdd8',
                        },
                    },
                    wAVAX: {
                        underlyingAssetAddress: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
                        aTokenAddress: '0x6d80113e533a2c0fe82eabd35f1875dcea89ea97',
                        wrappedTokens: {
                            stataAvaWAVAX: '0xa291ae608d8854cdbf9838e28e9badcf10181669',
                        },
                    },
                    wBTC: {
                        underlyingAssetAddress: '0x50b7545627a5162f82a992c33b87adc75187b218',
                        aTokenAddress: '0x078f358208685046a11c85e8ad32895ded33a249',
                        wrappedTokens: {
                            stataAvaWBTC: '0xb516f74eb030cebd5f616b1a33f88e1213b93c2c',
                        },
                    },
                },
            },
        },
        defaultHandlers: {
            sAVAX: {
                tokenAddress: '0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be',
                sourceUrl: 'https://api.benqi.fi/liquidstaking/apr',
                path: 'apr',
                scale: 1,
            },
            yyAVAX: {
                tokenAddress: '0xf7d9281e8e363584973f946201b82ba72c965d27',
                sourceUrl: 'https://staging-api.yieldyak.com/yyavax',
                path: 'yyAVAX.apr',
            },
            ggAVAX: {
                tokenAddress: '0xa25eaf2906fa1a3a13edac9b9657108af7b703e3',
                sourceUrl: 'https://api.gogopool.com/metrics',
                path: 'ggavax_apy',
                // Updated from https://ceres.gogopool.com/ which used below calculation and scale -8.3333
                // According to solarcurve, the AVAX Monthly Interest must be multiplied by -12 to represent the APR in normal scale, for example, if the monthly interest is -0,15, the APR would be -0,15 * -12 = 1,8%.
                // @solarcurve: We estimate by multiplying that value by -12 since its the exchange rate of AVAX -> ggAVAX, which will always return less ggAVAX than AVAX
                // How this -12 became -8,333? It's because the scale parameter is used to divide the number, and the final apr percentage is in decimal format (1,8% = 0,018), so if:
                // M * -12 = A (M is monthly rate and A is APR) => (M/x) = (A/100) => (A / -12x) = (A / 100) [replacing M by A/-12] => x = 100/-12 = -8,33333
            },
            ankrAVAX: {
                tokenAddress: '0xc3344870d52688874b06d844e0c36cc39fc727f6',
                sourceUrl: 'https://api.staking.ankr.com/v1alpha/metrics',
                path: 'services.{serviceName == "avax"}.apy',
                isIbYield: true,
            },
        },
    },
    beefy: {
        linearPools: [''],
    },
    datastudio: {
        main: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '11anHUEb9snGwvB-errb5HvO8TvoLTRJhkDdD80Gxw1Q',
            databaseTabName: 'Database v2',
            compositionTabName: 'Pool Composition v2',
            emissionDataTabName: 'EmissionData',
        },
        canary: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '1HnJOuRQXGy06tNgqjYMzQNIsaCSCC01Yxe_lZhXBDpY',
            databaseTabName: 'Database v2',
            compositionTabName: 'Pool Composition v2',
            emissionDataTabName: 'EmissionData',
        },
    },
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
        },
    },
};

export const avalancheNetworkConfig: NetworkConfig = {
    data: avalancheNetworkData,
    contentService: new GithubContentService(),
    provider: new ethers.providers.JsonRpcProvider({ url: avalancheNetworkData.rpcUrl, timeout: 60000 }),
    poolAprServices: [
        new YbTokensAprService(avalancheNetworkData.ybAprConfig, avalancheNetworkData.chain.prismaId),
        new PhantomStableAprService(avalancheNetworkData.chain.prismaId),
        new BoostedPoolAprService(),
        new SwapFeeAprService(),
        new GaugeAprService(tokenService, [avalancheNetworkData.bal!.address]),
    ],
    poolStakingServices: [new GaugeStakingService(gaugeSubgraphService, avalancheNetworkData.bal!.address)],
    userStakedBalanceServices: [new UserSyncGaugeBalanceService()],
    services: {
        balancerSubgraphService: new BalancerSubgraphService(
            avalancheNetworkData.subgraphs.balancer,
            avalancheNetworkData.chain.id,
        ),
    },
    /*
    For sub-minute jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3. 
    This is needed because the minimum alarm period is 1 minute and we want the alarm to trigger already after 1 minute instead of 3.

    For every 1 days jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3. 
    This is needed because the maximum alarm evaluation period is 1 day (period * evaluationPeriod).
    */
    workerJobs: [
        {
            name: 'update-token-prices',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'update-liquidity-for-inactive-pools',
            interval: every(1, 'days'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'update-liquidity-for-active-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(6, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'update-pool-apr',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(6, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'load-on-chain-data-for-pools-with-active-updates',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'minutes') : every(1, 'minutes'),
        },
        {
            name: 'sync-new-pools-from-subgraph',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(6, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'sync-tokens-from-pool-tokens',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
        {
            name: 'update-liquidity-24h-ago-for-all-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
        {
            name: 'cache-average-block-time',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-staking-for-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
        {
            name: 'sync-latest-snapshots-for-all-pools',
            interval: every(90, 'minutes'),
        },
        {
            name: 'update-lifetime-values-for-all-pools',
            interval: every(50, 'minutes'),
        },
        {
            name: 'sync-changed-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'minutes') : every(30, 'seconds'),
            alarmEvaluationPeriod: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
            alarmDatapointsToAlarm: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
        },
        {
            name: 'user-sync-wallet-balances-for-all-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(20, 'seconds'),
            alarmEvaluationPeriod: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
            alarmDatapointsToAlarm: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
        },
        {
            name: 'user-sync-staked-balances',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(20, 'seconds'),
            alarmEvaluationPeriod: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
            alarmDatapointsToAlarm: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? 3 : 1,
        },
        {
            name: 'update-fee-volume-yield-all-pools',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-vebal-balances',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(9, 'minutes') : every(3, 'minutes'),
        },
        {
            name: 'sync-vebal-totalSupply',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(10, 'minutes') : every(5, 'minutes'),
        },
        {
            name: 'feed-data-to-datastudio',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(5, 'minutes') : every(5, 'minutes'),
        },
        {
            name: 'sync-latest-fx-prices',
            interval: every(10, 'minutes'),
        },
    ],
};
