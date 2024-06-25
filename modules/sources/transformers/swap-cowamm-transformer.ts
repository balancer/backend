import _ from 'lodash';
import { BalancerSwapFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';
import { Chain } from '@prisma/client';
import { SwapEvent } from '../../../prisma/prisma-types';
import { CowAmmSwapFragment } from '../subgraphs/cow-amm/generated/types';

/**
 * Takes V2 subgraph swaps and transforms them into DB entries
 *
 * @param swaps
 * @param chain
 * @returns
 */
export function swapCowAmmTransformer(swap: CowAmmSwapFragment, chain: Chain): SwapEvent {
    return {
        id: swap.id, // tx + logIndex
        tx: swap.transactionHash,
        type: 'SWAP',
        poolId: swap.pool.id,
        chain: chain,
        protocolVersion: 1,
        userAddress: swap.user.id,
        blockNumber: Number(swap.blockNumber ?? 0),
        blockTimestamp: Number(swap.blockTimestamp),
        logIndex: Number(swap.logIndex),
        valueUSD: 0, // calculated later
        payload: {
            fee: {
                address: swap.swapFeeToken || swap.tokenIn,
                amount: swap.swapFeeAmount || '0',
                valueUSD: '0', // calculated later
            },
            surplus:
                swap.surplusAmount && swap.surplusToken
                    ? {
                          address: swap.surplusToken,
                          amount: swap.surplusAmount,
                          valueUSD: '0', // calculated later
                      }
                    : undefined,

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
