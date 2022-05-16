import { BalancerNetworkConfig } from '../balancer-types';

export const BALANCER_NETWORK_CONFIG: Record<string, BalancerNetworkConfig> = {
    '250': {
        vault: '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce',
        weth: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
        multicall: '0x09523Acc78Dd297Ae5Da00DdeBE6f10ebF784565',
    },
    '4': {
        vault: '0xF07513C68C55A31337E3b58034b176A15Dce16eD',
        weth: '0x80dD2B80FbcFB06505A301d732322e987380EcD6',
        multicall: '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
    },
    '10': {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        weth: '0x4200000000000000000000000000000000000006',
        multicall: '0x2DC0E2aa608532Da689e89e237dF582B783E552C',
    },
};
