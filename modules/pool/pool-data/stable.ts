import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const stableDynamic = (pool: BalancerPoolFragment, blockNumber: number) => {
    return {
        amp: pool.amp || '',
        blockNumber,
    };
};
