import { BalancerPoolFragment } from '../balancer-subgraph/generated/balancer-subgraph-types';
import { GqlBalancePoolApr, GqlBeetsFarm } from '../../schema';

export interface BalancerNetworkConfig {
    vault: string;
    weth: string;
    multicall: string;
}

export interface BalancerPoolWithFarm extends BalancerPoolFragment {
    farm?: GqlBeetsFarm;
    apr: GqlBalancePoolApr;
    isNewPool?: boolean;
    volume24h: string;
    fees24h: string;
}
