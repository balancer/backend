import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const fx = (pool: BalancerPoolFragment) => {
    return {
        alpha: pool.alpha || '',
        beta: pool.beta || '',
        delta: pool.delta || '',
        epsilon: pool.epsilon || '',
        lambda: pool.lambda || '',
    };
};
