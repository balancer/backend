import { SwapFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { Chain, PrismaPoolSwap } from '@prisma/client';

const tokenService = {
    async getTokenPrices(chain: Chain): Promise<Record<string, number>> {
        return {};
    },
    getPriceForToken(tokenPrices: Record<string, number>, token: string): number {
        return 0;
    },
};

export async function swapsTransformer(swaps: SwapFragment[], chain: Chain): Promise<PrismaPoolSwap[]> {
    const tokenPrices = await tokenService.getTokenPrices(chain);

    return swaps.map((swap) => {
        let valueUSD = 0;
        const tokenInPrice = tokenService.getPriceForToken(tokenPrices, swap.tokenIn); // TODO need to get price close to swap timestamp
        const tokenOutPrice = tokenService.getPriceForToken(tokenPrices, swap.tokenOut); // TODO need to get price close to swap timestamp

        if (tokenInPrice > 0) {
            valueUSD = tokenInPrice * parseFloat(swap.tokenAmountIn);
        } else {
            valueUSD = tokenOutPrice * parseFloat(swap.tokenAmountOut);
        }

        return {
            id: swap.id,
            chain: chain,
            timestamp: parseFloat(swap.blockTimestamp),
            poolId: swap.pool,
            userAddress: swap.user.id,
            tokenIn: swap.tokenIn,
            tokenInSym: swap.tokenInSymbol,
            tokenOut: swap.tokenOut,
            tokenOutSym: swap.tokenOutSymbol,
            tokenAmountIn: swap.tokenAmountIn,
            tokenAmountOut: swap.tokenAmountOut,
            tx: swap.transactionHash,
            valueUSD,
            batchSwapId: null,
            batchSwapIdx: null,
        };
    });
}
