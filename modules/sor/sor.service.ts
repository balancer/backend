import * as Sentry from '@sentry/node';
import { Address } from 'viem';

import config from '../../config';
import { GqlSorGetSwapPaths, QuerySorGetSwapPathsArgs } from '../../apps/api/gql/generated-schema';
import { GetSwapsV2Input as GetSwapPathsInput, GraphTraversalConfig } from './types';
import { getToken, getTokenAmountHuman, swapPathsZeroResponse } from './utils';
import { mapSwapTypeToSwapKind, mapToSorSwapPaths } from './utils/mapping';
import { sorGetPathsWithPools } from './sorV2/lib/static';
import { getBasePoolsFromDb } from './utils/pool';
import { PathWithAmount } from './sorV2/lib/path';
import { isValidSwapRequest, validateTokens } from './utils/validation';

export class SorService {
    async getSorSwapPaths(args: QuerySorGetSwapPathsArgs): Promise<GqlSorGetSwapPaths> {
        console.log('getSorSwaps args', JSON.stringify(args));
        const tokenIn = args.tokenIn.toLowerCase();
        const tokenOut = args.tokenOut.toLowerCase();
        const emptyResponse = swapPathsZeroResponse(args.tokenIn, args.tokenOut, args.chain);

        // Early returns for invalid requests
        if (!isValidSwapRequest(tokenIn, tokenOut, args.swapAmount, args.chain!)) {
            return emptyResponse;
        }

        if (!(await validateTokens(tokenIn, tokenOut, args.chain))) {
            return emptyResponse;
        }

        const amountToken = args.swapType === 'EXACT_IN' ? tokenIn : tokenOut;
        const amount = await getTokenAmountHuman(amountToken, args.swapAmount, args.chain!);
        const wethIsEth = tokenIn === config[args.chain].eth.address || tokenOut === config[args.chain].eth.address;

        const getSwapPathsInput: Omit<GetSwapPathsInput, 'protocolVersion'> = {
            chain: args.chain!,
            swapAmount: amount,
            swapType: args.swapType,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            queryBatchSwap: args.queryBatchSwap ? args.queryBatchSwap : false,
            callDataInput: args.callDataInput
                ? {
                      receiver: args.callDataInput.receiver,
                      sender: args.callDataInput.sender,
                      slippagePercentage: args.callDataInput.slippagePercentage,
                      deadline: args.callDataInput.deadline,
                      wethIsEth: wethIsEth,
                  }
                : undefined,
            considerPoolsWithHooks: args.considerPoolsWithHooks ?? true,
            poolIds: args.poolIds ?? undefined,
        };

        const mappedPaths = args.useProtocolVersion
            ? this.getSorSwapPathsForVersion({
                  ...getSwapPathsInput,
                  protocolVersion: args.useProtocolVersion,
              })
            : this.getBestSwapPathVersion(getSwapPathsInput);

        return mappedPaths;
    }

    public async getSorSwapPathsForVersion(input: GetSwapPathsInput, maxDepth = 4): Promise<GqlSorGetSwapPaths> {
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
            const swapKind = mapSwapTypeToSwapKind(input.swapType);

            // retry with different max depth if no paths are found
            let swapOptions = this.buildSwapOptions(maxDepth, input.graphTraversalConfig);
            let paths = await sorGetPathsWithPools(
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
                paths = await sorGetPathsWithPools(
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
        console.log(
            `SOR_V2_ERROR ${err.message} - tokenIn: ${input.tokenIn} - tokenOut: ${input.tokenOut} - swapAmount: ${input.swapAmount.amount} - swapType: ${input.swapType} - chain: ${input.chain}`,
        );

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
