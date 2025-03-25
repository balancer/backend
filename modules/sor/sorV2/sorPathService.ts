import { GqlSorGetSwapPaths } from '../../../apps/api/gql/generated-schema';
import { GetSwapsV2Input as GetSwapPathsInput } from '../types';
import * as Sentry from '@sentry/node';
import { Address } from 'viem';
import { sorGetPathsWithPools } from './lib/static';
import { getToken, swapPathsZeroResponse } from '../utils';
import { PathWithAmount } from './lib/path';
import { getBasePoolsFromDb } from '../utils/pool';
import { mapSwapTypeToSwapKind, mapToSorSwapPaths } from '../utils/mapping';

class SorPathService {
    // The new SOR service
    public async getSorSwapPaths(input: GetSwapPathsInput, maxNonBoostedPathDepth = 4): Promise<GqlSorGetSwapPaths> {
        const paths = await this.getSwapPathsFromSor(input, maxNonBoostedPathDepth);
        const emptyResponse = swapPathsZeroResponse(input.tokenIn, input.tokenOut, input.chain);

        if (!paths) {
            return emptyResponse;
        }

        return mapToSorSwapPaths(paths!, input.swapType, input.chain, input.protocolVersion as 2 | 3);
    }

    private async getSwapPathsFromSor(
        {
            chain,
            tokenIn,
            tokenOut,
            swapType,
            swapAmount,
            protocolVersion,
            graphTraversalConfig,
            considerPoolsWithHooks,
            poolIds,
        }: GetSwapPathsInput,
        maxNonBoostedPathDepth = 4,
    ): Promise<PathWithAmount[] | null> {
        try {
            const { pools: poolsFromDb, underlyingTokens } = await getBasePoolsFromDb(
                chain,
                protocolVersion,
                considerPoolsWithHooks,
                poolIds,
            );
            const tIn = await getToken(tokenIn as Address, chain);
            const tOut = await getToken(tokenOut as Address, chain);
            const swapKind = mapSwapTypeToSwapKind(swapType);
            const config = graphTraversalConfig
                ? {
                      graphTraversalConfig: {
                          maxNonBoostedPathDepth,
                          ...graphTraversalConfig,
                      },
                  }
                : {
                      graphTraversalConfig: {
                          maxNonBoostedPathDepth,
                      },
                  };
            const paths = await sorGetPathsWithPools(
                tIn,
                tOut,
                swapKind,
                swapAmount.amount,
                poolsFromDb,
                underlyingTokens,
                protocolVersion,
                config,
            );
            // if we dont find a path with depth 4, we try one more level.
            if (!paths && maxNonBoostedPathDepth < 5) {
                // TODO: we should be able to refactor this 'retry' logic so it's configurable from outside instead of hardcoding it here
                return this.getSwapPathsFromSor(arguments[0], maxNonBoostedPathDepth + 1);
            }
            return paths;
        } catch (err: any) {
            console.log(
                `SOR_V2_ERROR ${err.message} - tokenIn: ${tokenIn} - tokenOut: ${tokenOut} - swapAmount: ${swapAmount.amount} - swapType: ${swapType} - chain: ${chain}`,
            );
            Sentry.captureException(err.message, {
                tags: {
                    service: 'sorV2',
                    tokenIn,
                    tokenOut,
                    swapAmount: swapAmount.amount,
                    swapType,
                    chain,
                },
            });
            return null;
        }
    }
}

export const sorV2Service = new SorPathService();
