import { Factory } from 'fishery';
import { BalancerPoolTokenFragment } from '../../modules/subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const poolTokenFactory = Factory.define<BalancerPoolTokenFragment>(() => ({
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
}));
