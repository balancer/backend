import _ from 'lodash';
import { BalancerSwapFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { Chain } from '@prisma/client';
import { SwapEvent } from '../../../prisma/prisma-types';

/**
 * Takes V2 subgraph swaps and transforms them into DB entries
 *
 * @param swaps
 * @param chain
 * @returns
 */
export function swapV2Transformer(swap: BalancerSwapFragment, chain: Chain): SwapEvent {
    const protocolVersion = 2;

    // Avoiding scientific notation
    const feeFloat = parseFloat(swap.tokenAmountOut) * parseFloat(swap.poolId.swapFee ?? 0);
    const fee = feeFloat < 1e6 ? feeFloat.toFixed(18).replace(/0+$/, '').replace(/\.$/, '') : String(feeFloat);
    const feeFloatUSD = parseFloat(swap.valueUSD) * parseFloat(swap.poolId.swapFee ?? 0);
    const feeUSD =
        feeFloatUSD < 1e6 ? feeFloatUSD.toFixed(18).replace(/0+$/, '').replace(/\.$/, '') : String(feeFloatUSD);

    return {
        id: swap.id, // tx + logIndex
        tx: swap.tx,
        type: 'SWAP',
        poolId: swap.poolId.id,
        chain: chain,
        protocolVersion,
        userAddress: swap.userAddress.id,
        blockNumber: Number(swap.block ?? 0), // FANTOM is missing block
        blockTimestamp: Number(swap.timestamp),
        logIndex: Number(swap.id.substring(66)),
        valueUSD: Number(swap.valueUSD),
        payload: {
            fee: {
                address: swap.tokenOut,
                amount: fee,
                valueUSD: feeUSD,
            },
            tokenIn: {
                address: swap.tokenIn,
                amount: swap.tokenAmountIn,
            },
            tokenOut: {
                address: swap.tokenOut,
                amount: swap.tokenAmountOut,
            },
        },
    };
}
