import { Chain } from '@prisma/client';
import { GqlVotingPool } from '../../../schema';

const twammRootGaugeAddress = '0xb5bd58c733948e3d65d86ba9604e06e5da276fd1';
const cronRootGaugeAddress = '0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c';

const twammPool: GqlVotingPool = {
    chain: Chain.MAINNET,
    symbol: 'wstETH/rETH/L',
    id: '0x6910c4e32d425a834fb61e983c8083a84b0ebd01000200000000000000000532',
    address: '0x6910c4e32d425a834fb61e983c8083a84b0ebd01',
    type: 'UNKNOWN',
    tokens: [
        {
            address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
            weight: null,
            symbol: 'wstETH',
            logoURI:
                'https://raw.githubusercontent.com/balancer/tokenlists/main/src/assets/images/tokens/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0.png',
        },
        {
            address: '0xae78736cd615f374d3085123a210448e74fc6393',
            weight: null,
            symbol: 'rETH',
            logoURI:
                'https://raw.githubusercontent.com/balancer/tokenlists/main/src/assets/images/tokens/0xae78736cd615f374d3085123a210448e74fc6393.png',
        },
    ],
    rootGauge: {
        address: twammRootGaugeAddress,
        relativeWeightCap: null,
        isKilled: false,
    },
};

/* Balancer USDC/WETH/L from Cron Finance
   https://etherscan.io/address/0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c#readContract
   This is a special pool because Cron Contract is not compliant with BasePool interface so we won't find it the pools from the Subgraph
*/
const cronPool: GqlVotingPool = {
    chain: Chain.MAINNET,
    symbol: 'USDC/WETH/L',
    id: '0x0018c32d85d8aebea2efbe0b0f4a4eb9e4f1c8c900020000000000000000050c',
    address: '0x0018c32d85d8aebea2efbe0b0f4a4eb9e4f1c8c9',
    type: 'UNKNOWN',
    tokens: [
        {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            weight: null,
            symbol: 'USDC',
            logoURI:
                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        },
        {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            weight: null,
            symbol: 'WETH',
            logoURI:
                'https://raw.githubusercontent.com/balancer/tokenlists/main/src/assets/images/tokens/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
        },
    ],
    rootGauge: {
        address: cronRootGaugeAddress,
        relativeWeightCap: '0.02',
        isKilled: false,
    },
};

export const hardCodedPools: GqlVotingPool[] = [twammPool, cronPool];
