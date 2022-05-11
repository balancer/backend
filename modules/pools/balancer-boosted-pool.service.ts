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
                const price = tokenPriceService.getPriceForToken(tokenPrices, swap.tokenOut);
                const volume = price * parseFloat(swap.tokenAmountOut);
                // if (boostedPool.id === '0x64b301e21d640f9bef90458b0987d81fb4cf1b9e00020000000000000000022e') {
                //     console.log(
                //         `Price for ${swap.tokenOut} is ${price}. SwapAmount is ${swap.tokenAmountOut}}. For timestamp ${endTime}`,
                //     );
                // }
                return volume;
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
