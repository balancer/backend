import _ from 'lodash';
import { SwapFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { Chain } from '@prisma/client';
import { SwapEvent } from '../../../prisma/prisma-types';
import { prisma } from '../../../prisma/prisma-client';
import { weiToFloat } from '../../common/numbers';

/**
 * Takes V3 subgraph swaps and transforms them into DB entries
 *
 * @param swaps
 * @param chain
 * @returns
 */
export async function swapV3Transformer(swaps: SwapFragment[], chain: Chain): Promise<SwapEvent[]> {
    // V3 vault join/exit amounts are in wei so we need decimals to convert them to human readable amounts
    const allTokens = await prisma.prismaToken.findMany({ where: { chain } });

    return swaps.map((swap) => ({
        id: swap.id, // tx + logIndex
        tx: swap.transactionHash,
        type: 'SWAP',
        poolId: swap.pool,
        chain: chain,
        protocolVersion: 3,
        userAddress: swap.user.id,
        blockNumber: Number(swap.blockNumber),
        blockTimestamp: Number(swap.blockTimestamp),
        logIndex: Number(swap.logIndex),
        valueUSD: 0, // Will be calculated later
        payload: {
            fee: {
                address: swap.tokenOut,
                amount: String(
                    weiToFloat(swap.swapFeeAmount, allTokens.find((t) => t.address === swap.tokenOut)?.decimals || 18), // TODO this is dependent on givenIn vs givenOut
                ),
                valueUSD: '0', // Will be calculated later
            },
            tokenIn: {
                address: swap.tokenIn,
                amount: String(
                    weiToFloat(swap.tokenAmountIn, allTokens.find((t) => t.address === swap.tokenIn)?.decimals || 18),
                ),
            },
            tokenOut: {
                address: swap.tokenOut,
                amount: String(
                    weiToFloat(swap.tokenAmountOut, allTokens.find((t) => t.address === swap.tokenOut)?.decimals || 18),
                ),
            },
        },
    }));
}
