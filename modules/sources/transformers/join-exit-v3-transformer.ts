import _ from 'lodash';
import { JoinExitFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { Chain, PoolEventType } from '@prisma/client';
import { JoinExitEvent } from '../../../prisma/prisma-types';
import { prisma } from '../../../prisma/prisma-client';
import { weiToFloat } from '../../common/numbers';

/**
 * Takes V3 subgraph swaps and transforms them into DB entries
 *
 * @param swaps
 * @param chain
 * @returns
 */
export async function joinExitV3Transformer(events: JoinExitFragment[], chain: Chain): Promise<JoinExitEvent[]> {
    const protocolVersion = 3;
    // V3 vault join/exit amounts are in wei so we need decimals to convert them to human readable amounts
    const allTokens = await prisma.prismaToken.findMany({ where: { chain } });

    return events.map((event) => ({
        protocolVersion,
        id: event.id, // tx + logIndex
        tx: event.transactionHash,
        type: event.type === 'Join' ? PoolEventType.JOIN : PoolEventType.EXIT,
        poolId: event.pool.id,
        chain: chain,
        userAddress: event.user.id,
        blockNumber: Number(event.blockNumber),
        blockTimestamp: Number(event.blockTimestamp),
        logIndex: Number(event.logIndex),
        valueUSD: 0,
        payload: {
            tokens: event.pool.tokens.map((token) => ({
                address: token.address,
                amount: String(
                    weiToFloat(
                        event.amounts[token.index],
                        allTokens.find((t) => t.address === token.address)?.decimals || 18,
                    ),
                ),
                valueUSD: 0,
            })),
        },
    }));
}
