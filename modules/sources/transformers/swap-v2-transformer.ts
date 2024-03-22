import _ from 'lodash';
import { BalancerSwapWithBlockFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { Chain } from '@prisma/client';
import { SwapEvent } from '../../../prisma/prisma-types';

/**
 * Takes V2 subgraph swaps and transforms them into DB entries
 *
 * @param swaps
 * @param chain
 * @returns
 */
export function swapV2Transformer(swap: BalancerSwapWithBlockFragment, chain: Chain): SwapEvent {
    const vaultVersion = 2;

    // Avoiding scientific notation
    const feeFloat = parseFloat(swap.tokenAmountOut) * parseFloat(swap.poolId.swapFee ?? 0);
    const fee = feeFloat < 1e6 ? feeFloat.toFixed(18).replace(/0+$/, '') : String(feeFloat);

    return {
        id: swap.id, // tx + logIndex
        tx: swap.tx,
        type: 'SWAP',
        poolId: swap.poolId.id,
        chain: chain,
        vaultVersion,
        userAddress: swap.userAddress.id,
        blockNumber: Number(swap.block ?? 0), // FANTOM is missing block
        blockTimestamp: Number(swap.timestamp),
        logIndex: Number(swap.id.substring(66)),
        valueUSD: 0, // Will be calculated later
        payload: {
            fee: {
                address: swap.tokenOut,
                amount: fee,
                valueUSD: 0,
            },
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
