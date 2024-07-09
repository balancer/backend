import { env } from '../app/env';
import { NetworkData } from '../modules/network/network-config-types';

const rpcUrl = process.env.MODE_RPC_URL || 'https://mainnet.mode.network';

export default <NetworkData>{
    chain: {
        slug: 'mode',
        id: 34443,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x4200000000000000000000000000000000000006',
        prismaId: 'MODE',
        gqlId: 'MODE',
    },
    subgraphs: {
        startDate: '2024-05-22',
        balancer: `https://api.studio.thegraph.com/query/75376/balancer-mode-v2/version/latest`,
        beetsBar: '',
        blocks: 'https://api.studio.thegraph.com/query/48427/bleu-mode-blocks/version/latest',
        gauge: `https://api.studio.thegraph.com/query/75376/balancer-gauges-mode/version/latest`,
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ether',
    },
    weth: {
        address: '0x4200000000000000000000000000000000000006',
        addressFormatted: '0x4200000000000000000000000000000000000006',
    },
    coingecko: {
        nativeAssetId: 'mode',
        platformId: 'mode',
        excludedTokenAddresses: [],
    },
    rpcUrl,
    rpcMaxBlockRange: 5000,
    protocolToken: 'bal',
    bal: {
        address: '0xd08a2917653d4e460893203471f0000826fb4034',
    },
    veBal: {
        address: '0x9dd5db2d38b50bef682ce532bcca5dfd203915e1',
        bptAddress: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56',
        delegationProxy: '0x9805dcfD25e6De36bad8fe9D3Fe2c9b44B764102',
    },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '0x36cac20dd805d128c1a6dd16eea845c574b5a17c',
        },
        v3: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            routerAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
        },
    },
    ybAprConfig: {},
    multicall: '0xca11bde05977b3631167028862be2a173976ca11',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 2,
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
        },
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
};
