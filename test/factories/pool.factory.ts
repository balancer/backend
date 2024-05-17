import { Factory } from 'fishery';
import { BalancerPoolFragment } from '../../modules/subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const poolFactory = Factory.define<BalancerPoolFragment>(() => ({
    id: '123',
    poolType: 'A',
    address: '0x123456789',
    swapFee: '0.01',
    totalSwapVolume: '1000',
    totalSwapFee: '10',
    totalLiquidity: '10000',
    totalShares: '100',
    swapsCount: '5',
    holdersCount: '10',
    createTime: 1234567890, // Add createTime property as a number
    swapEnabled: true, // Add swapEnabled property
    tokensList: ['token1', 'token2'], // Add tokensList property
    tokens: [
        {
            id: 'token1',
            symbol: 'T1',
            name: 'Token 1',
            decimals: 18,
            address: 'token1',
            balance: '100',
            weight: '0.5',
            priceRate: '1',
            index: 0,
            token: {
                // token properties...
            },
        },
        {
            id: 'token2',
            symbol: 'T2',
            name: 'Token 2',
            decimals: 18,
            address: 'token2',
            balance: '200',
            weight: '0.5',
            priceRate: '1',
            index: 1,
            token: {
                // token properties...
            },
        },
    ],

    // Add other required properties...
}));
