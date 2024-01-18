import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const element = (pool: BalancerPoolFragment) => {
    return {
        unitSeconds: pool.unitSeconds || '',
        principalToken: pool.principalToken || '',
        baseToken: pool.baseToken || '',
    };
};
