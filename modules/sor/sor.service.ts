import * as Sentry from '@sentry/node';
import { Address, formatUnits } from 'viem';

import { GqlSorGetSwapPaths, QuerySorGetSwapPathsArgs } from '../../apps/api/gql/generated-schema';
import { GetSwapPathsInput, GraphTraversalConfig } from './types';
import { SOR } from './lib/sor';
import {
    getBasePoolsFromDb,
    getToken,
    isValidSwapRequest,
    mapSwapKind,
    mapToGetSwapPathsInput,
    mapToSorSwapPaths,
    swapPathsZeroResponse,
    validateTokens,
} from './utils';
import { PathWithAmount } from './lib/path';
import { getInputAmount, getOutputAmount } from './lib/utils';

const DEFAULT_MAX_DEPTH = 4;

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

        // map SOR Service inputs to SOR inputs
        const getSwapPathsInput = await mapToGetSwapPathsInput({ ...args, tokenIn, tokenOut });

        // get swap paths from sor for the requested protocol version mapped as sor service output type
        const { paths, protocolVersion } = args.useProtocolVersion
            ? await this.getSwapPathsWithRetry({
                  ...getSwapPathsInput,
                  protocolVersion: args.useProtocolVersion,
              })
            : await this.getBestSwapPathFromBothVersions(getSwapPathsInput);

        // return zero response if no paths are found
        if (!paths) {
            return swapPathsZeroResponse(
                getSwapPathsInput.tokenIn,
                getSwapPathsInput.tokenOut,
                getSwapPathsInput.chain,
            );
        }

        // map SOR output to SOR Service output
        const mappedPaths = await mapToSorSwapPaths(paths, args.swapType, args.chain, protocolVersion);

        return mappedPaths;
    }

    private async getBestSwapPathFromBothVersions(input: Omit<GetSwapPathsInput, 'protocolVersion'>): Promise<{
        paths: PathWithAmount[] | null;
        protocolVersion: number;
    }> {
        const pathsV2 = await this.getSwapPathsWithRetry({ ...input, protocolVersion: 2 });
        const pathsV3 = await this.getSwapPathsWithRetry({ ...input, protocolVersion: 3 });

        if (input.swapType === 'EXACT_IN') {
            return parseFloat(pathsV2.returnAmount) > parseFloat(pathsV3.returnAmount) ? pathsV2 : pathsV3;
        } else {
            // return swap path with smallest non-zero amountsIn (if it exists)
            if (parseFloat(pathsV2.returnAmount) === 0) {
                return pathsV3;
            } else if (parseFloat(pathsV3.returnAmount) === 0) {
                return pathsV2;
            } else {
                return parseFloat(pathsV3.returnAmount) < parseFloat(pathsV3.returnAmount) ? pathsV2 : pathsV3;
            }
        }
    }

    private async getSwapPathsWithRetry(
        input: GetSwapPathsInput,
    ): Promise<{ paths: PathWithAmount[] | null; protocolVersion: number; returnAmount: string }> {
        try {
            const { pools: poolsFromDb, bufferPools } = await getBasePoolsFromDb(
                input.chain,
                input.protocolVersion,
                input.considerPoolsWithHooks,
                input.poolIds,
            );

            const tokenIn = await getToken(input.tokenIn as Address, input.chain);
            const tokenOut = await getToken(input.tokenOut as Address, input.chain);
            const swapKind = mapSwapKind(input.swapType);

            // retry with different max depth if no paths are found
            let swapOptions = this.buildSwapOptions(DEFAULT_MAX_DEPTH);
            let paths = await SOR.getPathsWithPools(
                tokenIn,
                tokenOut,
                swapKind,
                input.swapAmount.amount,
                poolsFromDb,
                bufferPools,
                input.protocolVersion,
                swapOptions,
            );

            if (!paths) {
                swapOptions = this.buildSwapOptions(DEFAULT_MAX_DEPTH + 1);
                paths = await SOR.getPathsWithPools(
                    tokenIn,
                    tokenOut,
                    swapKind,
                    input.swapAmount.amount,
                    poolsFromDb,
                    bufferPools,
                    input.protocolVersion,
                    swapOptions,
                );
            }

            if (!paths) {
                return { paths: null, protocolVersion: input.protocolVersion, returnAmount: '0' };
            }

            // add returnAmount to result using getInputAmount and getOutputAmount
            const inputAmount = getInputAmount(paths);
            const outputAmount = getOutputAmount(paths);
            const returnAmountEvm = input.swapType === 'EXACT_IN' ? outputAmount : inputAmount;
            const returnAmount = formatUnits(returnAmountEvm.amount, returnAmountEvm.token.decimals);

            return { paths, protocolVersion: input.protocolVersion, returnAmount };
        } catch (err: any) {
            this.logSwapPathError(err, input);
            return { paths: null, protocolVersion: input.protocolVersion, returnAmount: '0' };
        }
    }

    private buildSwapOptions(maxNonBoostedPathDepth: number): {
        graphTraversalConfig: GraphTraversalConfig;
    } {
        return {
            graphTraversalConfig: {
                maxNonBoostedPathDepth,
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
