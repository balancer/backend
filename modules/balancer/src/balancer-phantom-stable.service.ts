import {
    BalancerPoolFragment,
    BalancerPoolTokenFragment,
} from '../../balancer-subgraph/generated/balancer-subgraph-types';
import { GqlBalancerPool } from '../../../schema';
import { TokenPrices } from '../../token-price/token-price-types';
import _ from 'lodash';
import { tokenPriceService } from '../../token-price/token-price.service';
import { balancerSubgraphService } from '../../balancer-subgraph/balancer-subgraph.service';

export class BalancerPhantomStableService {
    public isPhantomStablePool(pool: BalancerPoolFragment | GqlBalancerPool) {
        return pool.poolType === 'StablePhantom';
    }

    public async calculatePoolData(
        phantomStable: GqlBalancerPool | BalancerPoolFragment,
        startTime: number,
        endTime: number,
        pools: (GqlBalancerPool | BalancerPoolFragment)[],
        tokenPrices: TokenPrices,
    ): Promise<{ volume: number; swapFees: number }> {
        const swaps = await balancerSubgraphService.getAllSwaps({
            where: {
                poolId: phantomStable.id,
                tokenIn_not: phantomStable.address,
                tokenOut_not: phantomStable.address,
                timestamp_gte: startTime,
                timestamp_lte: endTime,
            },
        });

        const volume = _.sum(
            swaps.map((swap) => {
                const nestedPool = pools.find((pool) => pool.address === swap.tokenOut);

                if (nestedPool && nestedPool.poolType === 'Linear') {
                    const tokens = nestedPool.tokens || [];
                    const mainToken = typeof nestedPool.mainIndex === 'number' ? tokens[nestedPool.mainIndex] : null;
                    const wrappedToken =
                        typeof nestedPool.wrappedIndex === 'number' ? tokens[nestedPool.wrappedIndex] : null;
                    const mainTokenPrice = mainToken
                        ? tokenPriceService.getPriceForToken(tokenPrices, mainToken.address)
                        : 0;

                    return (
                        parseFloat(swap.tokenAmountOut) * parseFloat(wrappedToken?.priceRate ?? '0') * mainTokenPrice
                    );
                }

                return tokenPriceService.getPriceForToken(tokenPrices, swap.tokenOut) * parseFloat(swap.tokenAmountOut);
            }),
        );

        return {
            volume,
            swapFees: volume * parseFloat(phantomStable.swapFee),
        };
    }

    public calculatePoolLiquidity(
        phantomStable: BalancerPoolFragment,
        pools: BalancerPoolFragment[],
        tokenPrices: TokenPrices,
    ): number {
        const linearPools = pools.filter(
            (pool) => phantomStable.tokensList.includes(pool.address) && pool.id !== phantomStable.id,
        );

        const liquidities = linearPools.map((linearPool) => this.calculateLinearPoolLiquidity(linearPool, tokenPrices));

        return _.sum(liquidities);
    }

    private calculateLinearPoolLiquidity(pool: BalancerPoolFragment, tokenPrices: TokenPrices): number {
        const { mainToken, wrappedToken, mainTokenPrice } = this.getLinearPoolData(pool, tokenPrices);

        if (!mainToken || !wrappedToken) {
            return 0;
        }

        const mainTokenValue = parseFloat(mainToken.balance) * mainTokenPrice;
        const wrappedTokenValue =
            parseFloat(wrappedToken.balance) * parseFloat(wrappedToken.priceRate ?? '0') * mainTokenPrice;

        return mainTokenValue + wrappedTokenValue;
    }

    private getLinearPoolData(
        pool: BalancerPoolFragment,
        tokenPrices: TokenPrices,
    ): {
        mainToken: BalancerPoolTokenFragment | null;
        wrappedToken: BalancerPoolTokenFragment | null;
        mainTokenPrice: number;
    } {
        const tokens = pool.tokens || [];
        const mainToken = typeof pool.mainIndex === 'number' ? tokens[pool.mainIndex] : null;
        const wrappedToken = typeof pool.wrappedIndex === 'number' ? tokens[pool.wrappedIndex] : null;
        const mainTokenPrice = mainToken ? tokenPriceService.getPriceForToken(tokenPrices, mainToken.address) : 0;

        return {
            mainToken,
            wrappedToken,
            mainTokenPrice,
        };
    }
}
