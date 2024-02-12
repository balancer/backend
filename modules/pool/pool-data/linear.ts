import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const linear = (pool: BalancerPoolFragment) => {
    return {
        mainIndex: pool.mainIndex || 0,
        wrappedIndex: pool.wrappedIndex || 0,
        lowerTarget: pool.lowerTarget || '0',
        upperTarget: pool.upperTarget || '0',
    };
};
