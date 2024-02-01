import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const fx = (pool: BalancerPoolFragment) => {
    return {
        alpha: pool.alpha as string,
        beta: pool.beta as string,
        delta: pool.delta as string,
        epsilon: pool.epsilon as string,
        lambda: pool.lambda as string,
    };
};
