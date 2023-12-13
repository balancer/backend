import {
    BasePool,
    sorGetSwapsWithPools,
    Token,
    Address,
    SwapKind,
    sorParseRawPools,
    RawStablePool,
    RawWeightedPool,
    RawMetaStablePool,
    Swap as SwapSdk,
    RawPool,
    TokenAmount,
    RawGyro2Pool,
    RawGyro3Pool,
    RawGyroEPool,
} from '@balancer/sdk';
import { GqlSorSwapType, GqlSwap, GqlSorGetSwapsResponse, GqlPoolMinimal, GqlSorSwapRoute } from '../../../schema';
import { Chain, PrismaPoolType } from '@prisma/client';
import { GetSwapsInput, SwapResult, SwapService } from '../types';
import { tokenService } from '../../token/token.service';
import { networkContext } from '../../network/network-context.service';
import { prisma } from '../../../prisma/prisma-client';
import { PrismaPoolWithDynamic, prismaPoolWithDynamic } from '../../../prisma/prisma-types';
import { HumanAmount, SupportedRawPoolTypes } from '@balancer/sdk';
import { env } from '../../../app/env';
import { DeploymentEnv } from '../../network/network-config-types';
import { Cache, CacheClass } from 'memory-cache';
import { GqlCowSwapApiResponse } from '../../../schema';
import { BalancerSorService } from '../../beethoven/balancer-sor.service';
import { poolService } from '../../pool/pool.service';
import { BatchSwapStep } from '@balancer/sdk';
import { SingleSwap } from '@balancer/sdk';
import { SwapInfoRoute, SwapTypes, Swap, bnum, SwapInfoRouteHop } from '@balancer-labs/sor';
import { BigNumber } from 'ethers';
import { oldBnumScale } from '../../big-number/old-big-number';
import { mapRoutes } from './beetsHelpers';
import { poolsToIgnore } from '../constants';
import { AllNetworkConfigsKeyedOnChain, chainToIdMap } from '../../network/network-config';
import * as Sentry from '@sentry/node';

const ALL_BASEPOOLS_CACHE_KEY = `basePools:all`;

class SwapResultV2 implements SwapResult {
    private swap: SwapSdk | null;
    public inputAmount: bigint = BigInt(0);
    public outputAmount: bigint = BigInt(0);
    public isValid: boolean;

    constructor(swap: SwapSdk | null) {
        if (swap === null) {
            this.isValid = false;
            this.swap = null;
        } else {
            this.isValid = true;
            this.swap = swap;
            this.inputAmount = swap.inputAmount.amount;
            this.outputAmount = swap.outputAmount.amount;
        }
    }

    async getCowSwapResponse(chain = networkContext.chain, queryFirst = false): Promise<GqlCowSwapApiResponse> {
        if (!this.isValid || this.swap === null) throw new Error('No Response - Invalid Swap');

        if (!queryFirst) return this.mapResultToCowSwap(this.swap, this.swap.inputAmount, this.swap.outputAmount);
        else {
            const rpcUrl = AllNetworkConfigsKeyedOnChain[chain].data.rpcUrl;
            // Needs node >= 18 (https://github.com/wagmi-dev/viem/discussions/147)
            const updatedResult = await this.swap.query(rpcUrl);
            // console.log(`UPDATE:`, this.swap.quote.amount.toString(), updatedResult.amount.toString());

            const ip = this.swap.swapKind === SwapKind.GivenIn ? this.swap.inputAmount : updatedResult;
            const op = this.swap.swapKind === SwapKind.GivenIn ? updatedResult : this.swap.outputAmount;

            return this.mapResultToCowSwap(this.swap, ip, op);
        }
    }

    async getBeetsSwapResponse(queryFirst: boolean): Promise<GqlSorGetSwapsResponse> {
        if (!this.isValid || this.swap === null) throw new Error('No Response - Invalid Swap');

        return await this.mapResultToBeetsSwap(this.swap, this.swap.inputAmount, this.swap.outputAmount);
    }

    private async mapResultToBeetsSwap(
        swap: SwapSdk,
        inputAmount: TokenAmount,
        outputAmount: TokenAmount,
    ): Promise<GqlSorGetSwapsResponse> {
        const sor = new BalancerSorService();
        const tokens = await tokenService.getTokens();
        let poolIds: string[];
        if (swap.isBatchSwap) {
            const swaps = swap.swaps as BatchSwapStep[];
            poolIds = swaps.map((swap) => swap.poolId);
        } else {
            const singleSwap = swap.swaps as SingleSwap;
            poolIds = [singleSwap.poolId];
        }
        const pools = await poolService.getGqlPools({
            where: { idIn: poolIds },
        });

        const swapAmountForSwaps =
            swap.swapKind === SwapKind.GivenIn ? inputAmount.amount.toString() : outputAmount.amount.toString();
        const returnAmountFromSwaps =
            swap.swapKind === SwapKind.GivenIn ? outputAmount.amount.toString() : inputAmount.amount.toString();

        const swapData = {
            tokenIn: inputAmount.token.address.toString(),
            tokenOut: outputAmount.token.address.toString(),
            tokens,
            swapType: this.mapSwapKind(swap.swapKind),
            tokenInAmtEvm: inputAmount.amount.toString(),
            tokenOutAmtEvm: outputAmount.amount.toString(),
            swapAmountForSwaps,
            returnAmountFromSwaps,
            returnAmountConsideringFees: returnAmountFromSwaps,
            routes: this.mapRoutes(
                swap.swaps,
                inputAmount.amount.toString(),
                outputAmount.amount.toString(),
                pools,
                swap.inputAmount.token.address,
                swap.outputAmount.token.address,
                swap.assets,
                swap.swapKind,
            ),
            pools,
            marketSp: '0', // Daniel confirmed returning 0 should be fine here
            swaps: this.mapSwaps(swap.swaps, swap.assets),
            tokenAddresses: swap.assets,
        };
        return sor.formatResponse(swapData);
    }

    private mapSwaps(swaps: BatchSwapStep[] | SingleSwap, assets: string[]): GqlSwap[] {
        if (Array.isArray(swaps)) {
            return swaps.map((swap) => {
                return {
                    ...swap,
                    assetInIndex: Number(swap.assetInIndex.toString()),
                    assetOutIndex: Number(swap.assetOutIndex.toString()),
                    amount: swap.amount.toString(),
                };
            });
        } else {
            const assetInIndex = assets.indexOf(swaps.assetIn);
            const assetOutIndex = assets.indexOf(swaps.assetOut);
            return [
                {
                    ...swaps,
                    assetInIndex,
                    assetOutIndex,
                    amount: swaps.amount.toString(),
                },
            ];
        }
    }

    private mapSwapKind(kind: SwapKind): GqlSorSwapType {
        return kind === SwapKind.GivenIn ? 'EXACT_IN' : 'EXACT_OUT';
    }

    private mapRoutes(
        swaps: BatchSwapStep[] | SingleSwap,
        inputAmount: string,
        outputAmount: string,
        pools: GqlPoolMinimal[],
        assetIn: string,
        assetOut: string,
        assets: string[],
        kind: SwapKind,
    ): GqlSorSwapRoute[] {
        return mapRoutes(swaps, inputAmount, outputAmount, pools, assetIn, assetOut, assets, kind);
    }

    /**
     * Formats a sequence of swaps to a format that is useful for displaying the routes in user interfaces.
     * Taken directly from Beets SOR: https://github.com/beethovenxfi/balancer-sor/blob/beethovenx-master/src/formatSwaps.ts#L167
     * @dev The swaps are converted to an array of routes, where each route has an array of hops
     * @param swapType - exact in or exact out
     * @param routes - The original Swaps
     * @param swapAmount - The total amount being swapped
     * @returns SwapInfoRoute[] - The swaps formatted as routes with hops
     */
    private formatRoutesSOR(swapType: SwapTypes, routes: Swap[][], swapAmount: BigNumber): SwapInfoRoute[] {
        const exactIn = swapType === SwapTypes.SwapExactIn;

        return routes.map((swaps) => {
            const first = swaps[0];
            const last = swaps[swaps.length - 1];
            const tokenInAmount = (exactIn ? first.swapAmount : last.swapAmountOut) || '0';
            const tokenOutAmount = (exactIn ? last.swapAmountOut : first.swapAmount) || '0';
            const tokenInAmountScaled = oldBnumScale(bnum(tokenInAmount), first.tokenInDecimals);

            return {
                tokenIn: first.tokenIn,
                tokenOut: last.tokenOut,
                tokenInAmount,
                tokenOutAmount,
                share: tokenInAmountScaled.div(bnum(swapAmount.toString())).toNumber(),
                hops: swaps.map((swap): SwapInfoRouteHop => {
                    return {
                        tokenIn: swap.tokenIn,
                        tokenOut: swap.tokenOut,
                        tokenInAmount: (exactIn ? swap.swapAmount : swap.swapAmountOut) || '0',
                        tokenOutAmount: (exactIn ? swap.swapAmountOut : swap.swapAmount) || '0',
                        poolId: swap.pool,
                    };
                }),
            };
        });
    }

    /**
     * Maps Swap to GqlCowSwapApiResponse which is what current CowSwap Solver uses.
     * @param swap
     * @returns
     */
    private mapResultToCowSwap(
        swap: SwapSdk,
        inputAmount: TokenAmount,
        outputAmount: TokenAmount,
    ): GqlCowSwapApiResponse {
        let swaps: GqlSwap[];
        if (swap.swaps instanceof Array) {
            swaps = swap.swaps.map((swap) => {
                return {
                    ...swap,
                    amount: swap.amount.toString(),
                    assetInIndex: Number(swap.assetInIndex),
                    assetOutIndex: Number(swap.assetOutIndex),
                };
            });
        } else {
            swaps = [
                {
                    amount: inputAmount.amount.toString(),
                    assetInIndex: swap.assets.indexOf(swap.swaps.assetIn),
                    assetOutIndex: swap.assets.indexOf(swap.swaps.assetOut),
                    poolId: swap.swaps.poolId,
                    userData: swap.swaps.userData,
                },
            ];
        }
        const returnAmount =
            swap.swapKind === SwapKind.GivenIn ? outputAmount.amount.toString() : inputAmount.amount.toString();
        const swapAmount =
            swap.swapKind === SwapKind.GivenIn ? inputAmount.amount.toString() : outputAmount.amount.toString();
        return {
            marketSp: '', // CowSwap is not using this field, confirmed.
            returnAmount,
            returnAmountConsideringFees: returnAmount, // CowSwap is not using this field, confirmed.
            returnAmountFromSwaps: returnAmount, // CowSwap is not using this field, confirmed.
            swapAmount,
            swapAmountForSwaps: swapAmount, // CowSwap is not using this field, confirmed.
            swaps,
            tokenAddresses: swap.assets,
            tokenIn: swap.inputAmount.token.address,
            tokenOut: swap.outputAmount.token.address,
        };
    }
}

export class SorV2Service implements SwapService {
    cache: CacheClass<string, BasePool[]>;

    constructor() {
        this.cache = new Cache<string, BasePool[]>();
    }

    public async getSwapResult(
        { chain, tokenIn, tokenOut, swapType, swapAmount, graphTraversalConfig }: GetSwapsInput,
        maxNonBoostedPathDepth = 4,
    ): Promise<SwapResult> {
        try {
            const poolsFromDb = await this.getBasePools(chain);
            const tIn = await this.getToken(tokenIn as Address, chain);
            const tOut = await this.getToken(tokenOut as Address, chain);
            const swapKind = this.mapSwapType(swapType);
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

            console.info(
                `SOR: Fetching SORv2 on ${chain} for ${tokenIn} -> ${tokenOut} with maxNonBoostedPathDepth`,
                maxNonBoostedPathDepth,
            );
            const swap = await sorGetSwapsWithPools(tIn, tOut, swapKind, swapAmount, poolsFromDb, config);
            if (!swap && maxNonBoostedPathDepth < 6) {
                return this.getSwapResult(arguments[0], maxNonBoostedPathDepth + 1);
            }
            return new SwapResultV2(swap);
        } catch (err: any) {
            console.error(
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
            return new SwapResultV2(null);
        }
    }

    /**
     * Gets a b-sdk Token based off tokenAddr.
     * @param address
     * @param chain
     * @returns
     */
    private async getToken(address: Address, chain: Chain): Promise<Token> {
        const token = await tokenService.getToken(address, chain);
        if (!token) {
            throw new Error('Unknown token: ' + address);
        }
        const chainId = Number(chainToIdMap[chain]);
        return new Token(chainId, address, token.decimals, token.symbol);
    }

    private mapSwapType(swapType: GqlSorSwapType): SwapKind {
        return swapType === 'EXACT_IN' ? SwapKind.GivenIn : SwapKind.GivenOut;
    }

    private async getBasePools(chain: Chain): Promise<BasePool[]> {
        let basePools: BasePool[] | null = this.cache.get(`${ALL_BASEPOOLS_CACHE_KEY}:${chain}`);
        if (!basePools) {
            basePools = await this.getBasePoolsFromDb(chain);
            this.cache.put(`${ALL_BASEPOOLS_CACHE_KEY}:${chain}`, basePools, 5 * 60 * 1000);
        }
        return basePools;
    }

    /**
     * Fetch pools from Prisma and map to b-sdk BasePool.
     * @returns
     */
    private async getBasePoolsFromDb(chain: Chain): Promise<BasePool[]> {
        const { poolIdsToExclude } = AllNetworkConfigsKeyedOnChain[chain].data.sor[env.DEPLOYMENT_ENV as DeploymentEnv];
        const pools = await prisma.prismaPool.findMany({
            where: {
                chain,
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                    swapEnabled: true,
                },
                id: {
                    notIn: [...poolIdsToExclude, ...poolsToIgnore],
                },
                type: {
                    notIn: [
                        'LINEAR', // Linear pools are sunset so ignore to avoid issues related to lack of support
                        'LIQUIDITY_BOOTSTRAPPING', // not supported by b-sdk
                        'ELEMENT', // not supported by b-sdk
                        'UNKNOWN', // not supported by b-sdk
                        'INVESTMENT', // not supported by b-sdk
                        'FX', // TODO: FX pool tokens are missing latestFXPrice - needs to be added to the DB
                    ],
                },
                AND: {
                    NOT: {
                        // not supported by b-sdk
                        type: 'STABLE',
                        version: {
                            in: [1, 2],
                        },
                    },
                },
            },
            include: prismaPoolWithDynamic.include,
        });
        const rawPools = this.mapToRawPools(pools);
        return this.mapToBasePools(rawPools, chain);
    }

    /**
     * Map Prisma pools to b-sdk RawPool.
     * @param pools
     * @returns
     */
    private mapToRawPools(pools: PrismaPoolWithDynamic[]): RawPool[] {
        return pools.map((prismaPool) => {
            // b-sdk: src/data/types.ts
            let rawPool: RawPool = {
                id: prismaPool.id as Address,
                address: prismaPool.address as Address,
                poolType: this.mapRawPoolType(prismaPool.type),
                poolTypeVersion: prismaPool.version,
                tokensList: prismaPool.tokens.map((t) => t.address as Address),
                swapEnabled: prismaPool.dynamicData!.swapEnabled,
                swapFee: prismaPool.dynamicData!.swapFee as unknown as HumanAmount,
                totalShares: prismaPool.dynamicData!.totalShares as unknown as HumanAmount,
                liquidity: prismaPool.dynamicData!.totalLiquidity as unknown as HumanAmount,
                tokens: prismaPool.tokens.map((t) => {
                    return {
                        address: t.token.address as Address,
                        index: t.index,
                        symbol: t.token.symbol,
                        name: t.token.name,
                        decimals: t.token.decimals,
                        balance: t.dynamicData?.balance as unknown as HumanAmount,
                    };
                }),
                isPaused: !!prismaPool.dynamicData?.isPaused,
                inRecoveryMode: !!prismaPool.dynamicData?.isInRecoveryMode,
                name: 'n/a',
            };
            if (['Weighted', 'Investment', 'LiquidityBootstrapping'].includes(rawPool.poolType)) {
                rawPool = {
                    ...rawPool,
                    tokens: rawPool.tokens.map((t, i) => {
                        return { ...t, weight: prismaPool.tokens[i].dynamicData?.weight };
                    }),
                } as RawWeightedPool;
            }
            if (rawPool.poolType === 'Stable') {
                rawPool = {
                    ...rawPool,
                    amp: prismaPool.stableDynamicData?.amp,
                } as RawStablePool;
            }
            if (['MetaStable', 'ComposableStable'].includes(rawPool.poolType)) {
                rawPool = {
                    ...rawPool,
                    amp: prismaPool.stableDynamicData?.amp.split('.')[0], // Taken b-sdk onChainPoolDataEnricher.ts
                    tokens: rawPool.tokens.map((t, i) => {
                        return { ...t, priceRate: prismaPool.tokens[i].dynamicData?.priceRate };
                    }),
                } as RawMetaStablePool;
            }
            if (rawPool.poolType === 'Gyro2') {
                rawPool = {
                    ...rawPool,
                    alpha: prismaPool.gyroData?.alpha,
                    beta: prismaPool.gyroData?.beta,
                    sqrtAlpha: prismaPool.gyroData?.sqrtAlpha,
                    sqrtBeta: prismaPool.gyroData?.sqrtBeta,
                } as RawGyro2Pool;
            }
            if (rawPool.poolType === 'Gyro3') {
                rawPool = {
                    ...rawPool,
                    root3Alpha: prismaPool.gyroData?.root3Alpha,
                } as RawGyro3Pool;
            }
            if (rawPool.poolType === 'GyroE') {
                rawPool = {
                    ...rawPool,
                    alpha: prismaPool.gyroData?.alpha,
                    beta: prismaPool.gyroData?.beta,
                    c: prismaPool.gyroData?.c,
                    s: prismaPool.gyroData?.s,
                    lambda: prismaPool.gyroData?.lambda,
                    tauAlphaX: prismaPool.gyroData?.tauAlphaX,
                    tauAlphaY: prismaPool.gyroData?.tauAlphaY,
                    tauBetaX: prismaPool.gyroData?.tauBetaX,
                    tauBetaY: prismaPool.gyroData?.tauBetaY,
                    u: prismaPool.gyroData?.u,
                    v: prismaPool.gyroData?.v,
                    w: prismaPool.gyroData?.w,
                    z: prismaPool.gyroData?.z,
                    dSq: prismaPool.gyroData?.dSq,
                    tokenRates: prismaPool.tokens.map((t) => t.dynamicData?.priceRate),
                } as RawGyroEPool;
            }
            return rawPool;
        });
    }

    /**
     * Map b-sdk RawPools to BasePools.
     * @param pools
     * @returns
     */
    private mapToBasePools(pools: RawPool[], chain: Chain): BasePool[] {
        const chainId = Number(chainToIdMap[chain]);
        return sorParseRawPools(chainId, pools);
    }

    /**
     * Map Prisma pool type to b-sdk Raw pool type.
     * @param type
     * @returns
     */
    private mapRawPoolType(type: PrismaPoolType): SupportedRawPoolTypes | string {
        // From b-sdk:
        // - type LinearPoolType = `${string}Linear`;
        // - LinearPoolType | 'Weighted' | 'Investment' | 'LiquidityBootstrapping' | 'Stable' | 'MetaStable' | 'ComposableStable' | 'StablePhantom' | 'Element';
        switch (type) {
            case PrismaPoolType.WEIGHTED:
                return 'Weighted';
            case PrismaPoolType.INVESTMENT:
                return 'Investment';
            case PrismaPoolType.LIQUIDITY_BOOTSTRAPPING:
                return 'LiquidityBootstrapping';
            case PrismaPoolType.STABLE:
                return 'Stable';
            case PrismaPoolType.META_STABLE:
                return 'MetaStable';
            case PrismaPoolType.PHANTOM_STABLE:
                // Composablestables are PHANTOM_STABLE in Prisma. b-sdk treats Phantoms as ComposableStable.
                return 'ComposableStable';
            case PrismaPoolType.GYRO:
                return 'Gyro2';
            case PrismaPoolType.GYRO3:
                return 'Gyro3';
            case PrismaPoolType.GYROE:
                return 'GyroE';
            default:
                return type;
        }
    }
}

export const sorV2Service = new SorV2Service();
