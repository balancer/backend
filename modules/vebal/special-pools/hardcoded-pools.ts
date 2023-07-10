import { Chain } from '@prisma/client';
import { VotingListPool } from '../voting-list.service';

const twammRootGaugeAddress = '0xb5bd58c733948e3d65d86ba9604e06e5da276fd1';

const twammPool: VotingListPool = {
    chain: Chain.MAINNET,
    symbol: 'wstETH/rETH/L',
    id: '0x6910c4e32d425a834fb61e983c8083a84b0ebd01000200000000000000000532',
    address: '0x6910c4e32d425a834fb61e983c8083a84b0ebd01',
    type: 'UNKNOWN',
    tokens: [
        {
            address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
            dynamicData: {
                weight: null,
            },
            token: {
                symbol: 'wstETH',
                logoURI:
                    'https://raw.githubusercontent.com/balancer/tokenlists/main/src/assets/images/tokens/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0.png',
            },
        },
        {
            address: '0xae78736cd615f374d3085123a210448e74fc6393',
            dynamicData: {
                weight: null,
            },
            token: {
                symbol: 'rETH',
                logoURI:
                    'https://raw.githubusercontent.com/balancer/tokenlists/main/src/assets/images/tokens/0xae78736cd615f374d3085123a210448e74fc6393.png',
            },
        },
    ],
    gauge: {
        address: twammRootGaugeAddress,
        relativeWeightCap: null,
        isKilled: false,
    },
};

export const hardCodedPools: VotingListPool[] = [twammPool];
