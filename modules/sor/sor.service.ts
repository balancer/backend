import * as Sentry from '@sentry/node';
import { Address } from 'viem';

import { GqlSorGetSwapPaths, QuerySorGetSwapPathsArgs } from '../../apps/api/gql/generated-schema';
import { GetSwapPathsInput, GraphTraversalConfig } from './types';
import { getToken, swapPathsZeroResponse } from './utils/helpers';
import { mapSwapKind, mapToGetSwapPathsInput, mapToSorSwapPaths } from './utils/mapping';
import { SOR } from './lib/sor';
import { getBasePoolsFromDb } from './utils/pool';
import { PathWithAmount } from './lib/path';
import { isValidSwapRequest, validateTokens } from './utils/validation';

export class SorService {
    async getSorSwapPaths(args: QuerySorGetSwapPathsArgs): Promise<GqlSorGetSwapPaths> {
        console.log('getSorSwaps args', JSON.stringify(args));
        const tokenIn = args.tokenIn.toLowerCase();
        const tokenOut = args.tokenOut.toLowerCase();

        // early returns for invalid requests
        if (!isValidSwapRequest(tokenIn, tokenOut, args.swapAmount, args.chain!)) {
            return swapPathsZeroResponse(args.tokenIn, args.tokenOut, args.chain);
        }
        if (!(await validateTokens(tokenIn, tokenOut, args.chain))) {
            return swapPathsZeroResponse(args.tokenIn, args.tokenOut, args.chain);
        }

        // map query inputs to sor inputs
        const getSwapPathsInput = await mapToGetSwapPathsInput({ ...args, tokenIn, tokenOut });

        // get swap paths from sor for the requested protocol version mapped as sor service output type
        const mappedPaths = args.useProtocolVersion
            ? this.getSorSwapPathsForVersion({
                  ...getSwapPathsInput,
                  protocolVersion: args.useProtocolVersion,
              })
            : this.getBestSwapPathVersion(getSwapPathsInput);

        return mappedPaths;
    }

    private async getSorSwapPathsForVersion(input: GetSwapPathsInput, maxDepth = 4): Promise<GqlSorGetSwapPaths> {
        const paths = await this.getSwapPathsWithRetry(input, maxDepth);

        if (!paths) {
            return swapPathsZeroResponse(input.tokenIn, input.tokenOut, input.chain);
        }

        return mapToSorSwapPaths(paths, input.swapType, input.chain, input.protocolVersion as 2 | 3);
    }

    private async getBestSwapPathVersion(input: Omit<GetSwapPathsInput, 'protocolVersion'>) {
        const swapBalancerV2 = await this.getSorSwapPathsForVersion({ ...input, protocolVersion: 2 });
        const swapBalancerV3 = await this.getSorSwapPathsForVersion({ ...input, protocolVersion: 3 });

        if (input.swapType === 'EXACT_IN') {
            return parseFloat(swapBalancerV2.returnAmount) > parseFloat(swapBalancerV3.returnAmount)
                ? swapBalancerV2
                : swapBalancerV3;
        } else {
            // return swap path with smallest non-zero amountsIn (if it exists)
            if (parseFloat(swapBalancerV2.returnAmount) === 0) {
                return swapBalancerV3;
            } else if (parseFloat(swapBalancerV3.returnAmount) === 0) {
                return swapBalancerV2;
            } else {
                return parseFloat(swapBalancerV2.returnAmount) < parseFloat(swapBalancerV3.returnAmount)
                    ? swapBalancerV2
                    : swapBalancerV3;
            }
        }
    }

    private async getSwapPathsWithRetry(
        input: GetSwapPathsInput,
        maxDepth: number = 4,
    ): Promise<PathWithAmount[] | null> {
        try {
            const { pools: poolsFromDb, underlyingTokens } = await getBasePoolsFromDb(
                input.chain,
                input.protocolVersion,
                input.considerPoolsWithHooks,
                input.poolIds,
            );

            const tokenIn = await getToken(input.tokenIn as Address, input.chain);
            const tokenOut = await getToken(input.tokenOut as Address, input.chain);
            const swapKind = mapSwapKind(input.swapType);

            // retry with different max depth if no paths are found
            let swapOptions = this.buildSwapOptions(maxDepth, input.graphTraversalConfig);
            let paths = await SOR.getPathsWithPools(
                tokenIn,
                tokenOut,
                swapKind,
                input.swapAmount.amount,
                poolsFromDb,
                underlyingTokens,
                input.protocolVersion,
                swapOptions,
            );

            if (!paths) {
                swapOptions = this.buildSwapOptions(maxDepth + 1, input.graphTraversalConfig);
                paths = await SOR.getPathsWithPools(
                    tokenIn,
                    tokenOut,
                    swapKind,
                    input.swapAmount.amount,
                    poolsFromDb,
                    underlyingTokens,
                    input.protocolVersion,
                    swapOptions,
                );
            }

            return paths;
        } catch (err: any) {
            this.logSwapPathError(err, input);
            return null;
        }
    }

    private buildSwapOptions(
        maxNonBoostedPathDepth: number,
        graphTraversalConfig?: GraphTraversalConfig,
    ): { graphTraversalConfig: GraphTraversalConfig } {
        return {
            graphTraversalConfig: {
                maxNonBoostedPathDepth,
                ...graphTraversalConfig,
            },
        };
    }

    private logSwapPathError(err: any, input: GetSwapPathsInput): void {
        console.table({
            error: 'SOR_V2_ERROR',
            message: err.message,
            tokenIn: input.tokenIn,
            tokenOut: input.tokenOut,
            swapAmount: input.swapAmount.amount,
            swapType: input.swapType,
            chain: input.chain,
        });

        Sentry.captureException(err.message, {
            tags: {
                service: 'sorV2',
                tokenIn: input.tokenIn,
                tokenOut: input.tokenOut,
                swapAmount: input.swapAmount.amount,
                swapType: input.swapType,
                chain: input.chain,
            },
        });
    }
}

export const sorService = new SorService();
