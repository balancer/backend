import _ from 'lodash';
import { SwapFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { Chain } from '@prisma/client';
import { SwapEvent } from '../../../prisma/prisma-types';

/**
 * Takes V3 subgraph swaps and transforms them into DB entries
 *
 * @param swaps
 * @param chain
 * @returns
 */
export function swapTransformer(swap: SwapFragment, chain: Chain): SwapEvent {
    const vaultVersion = 3;

    return {
        id: swap.id, // tx + logIndex
        tx: swap.transactionHash,
        type: 'SWAP',
        poolId: swap.pool,
        chain: chain,
        vaultVersion,
        userAddress: swap.user.id,
        blockNumber: Number(swap.blockNumber),
        blockTimestamp: Number(swap.blockTimestamp),
        logIndex: Number(swap.logIndex),
        valueUSD: 0, // Will be calculated later
        payload: {
            tokenIn: {
                address: swap.tokenIn,
                amount: swap.tokenAmountIn,
                valueUSD: 0,
            },
            tokenOut: {
                address: swap.tokenOut,
                amount: swap.tokenAmountOut,
                valueUSD: 0,
            },
        },
    };
}
