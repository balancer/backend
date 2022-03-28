import {
    BalancerPoolFragment,
    BalancerPoolTokenFragment,
    BalancerSwapFragment,
} from '../balancer-subgraph/generated/balancer-subgraph-types';
import { GqlBalancerPool } from '../../schema';
import { TokenPrices } from '../token-price/token-price-types';
import _ from 'lodash';
import { tokenPriceService } from '../token-price/token-price.service';
import { balancerSubgraphService } from '../balancer-subgraph/balancer-subgraph.service';
import { addressesMatch } from '../util/addresses';

export class BalancerBoostedPoolService {
    public hasNestedBpt(
        pool: BalancerPoolFragment | GqlBalancerPool,
        pools: BalancerPoolFragment[] | GqlBalancerPool[],
    ) {
        const poolMap = _.keyBy(pools, 'address');
        const tokens = pool.tokens || [];

        for (const token of tokens) {
            if (poolMap[token.address]) {
                return true;
            }
        }

        return false;
    }

    public isPhantomStablePool(pool: BalancerPoolFragment | GqlBalancerPool) {
        return pool.poolType === 'StablePhantom';
    }

    public async calculatePoolData(
        boostedPool: GqlBalancerPool | BalancerPoolFragment,
        startTime: number,
        endTime: number,
        pools: (GqlBalancerPool | BalancerPoolFragment)[],
        tokenPrices: TokenPrices,
    ): Promise<{ volume: number; swapFees: number }> {
        const swaps = await balancerSubgraphService.getAllSwaps({
            where: {
                poolId: boostedPool.id,
                tokenIn_not: boostedPool.address,
                tokenOut_not: boostedPool.address,
                timestamp_gte: startTime,
                timestamp_lte: endTime,
            },
        });

        const volume = _.sum(
            swaps.map((swap) => {
                return tokenPriceService.getPriceForToken(tokenPrices, swap.tokenOut) * parseFloat(swap.tokenAmountOut);
            }),
        );

        return {
            volume,
            swapFees: volume * parseFloat(boostedPool.swapFee),
        };
    }

    public calculatePoolLiquidity(boostedPool: BalancerPoolFragment, tokenPrices: TokenPrices): number {
        const tokens = boostedPool.tokens || [];
        let totalLiquidity = 0;

        for (const token of tokens) {
            if (token.address === boostedPool.address) {
                continue;
            }

            totalLiquidity +=
                parseFloat(token.balance) * tokenPriceService.getPriceForToken(tokenPrices, token.address);
        }

        return totalLiquidity;
    }
}
