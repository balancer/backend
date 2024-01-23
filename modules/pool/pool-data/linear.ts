import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const linear = (pool: BalancerPoolFragment) => {
    return {
        mainIndex: pool.mainIndex || 0,
        wrappedIndex: pool.wrappedIndex || 0,
    };
};

export const linearDynamic = (pool: BalancerPoolFragment, blockNumber: number) => {
    return {
        upperTarget: pool.upperTarget || '',
        lowerTarget: pool.lowerTarget || '',
        blockNumber,
    };
};
