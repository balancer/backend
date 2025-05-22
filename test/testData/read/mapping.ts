import { Address, formatEther, formatUnits } from 'viem';
import { isSameAddress, Token } from '@balancer/sdk';

import { PoolTokenWithRate } from '../../../modules/sor/lib/utils';
import { PrismaPoolAndHookWithDynamic } from '../../../prisma/prisma-types';
import { prismaPoolFactory, prismaPoolTokenFactory } from '../../factories';
import { getDecimalsFromScalingFactor } from '../../utils';
import { BufferPool, GyroEPool, QuantAmmPool, ReClammPool, StablePool, WeightedPool } from './readTestData';
import { chainIdToChain } from '../../../modules/network/chain-id-to-chain';

export function mapGyroPoolStateToPrismaPool(
    poolState: GyroEPool,
    chainId: number,
    protocolVersion: number,
    bufferPools: BufferPool[],
): PrismaPoolAndHookWithDynamic {
    const decimals = poolState.scalingFactors.map((scalingFactor: bigint) =>
        getDecimalsFromScalingFactor(scalingFactor),
    );

    const poolTokens = poolState.tokens.map(
        (token: string, i: number) => new Token(chainId, token as Address, decimals[i]),
    );

    const tokenAmounts = poolTokens.map((token: Token, i: number) =>
        PoolTokenWithRate.fromScale18AmountWithRate(
            token,
            poolState.balancesLiveScaled18[i],
            poolState.tokenRates[i],
            i,
        ),
    );

    // map tokenIn and tokenOut to prisma tokens using prisma token factory
    const tokens = poolState.tokens.map((_token, i) => {
        const bufferPool = bufferPools.find((bufferPool) =>
            isSameAddress(_token as Address, bufferPool.poolAddress as Address),
        );
        const token = bufferPool
            ? {
                  decimals: decimals[i],
                  unwrapRate: formatUnits(bufferPool.rate, 18 - decimals[i] + bufferPool.decimals[1]),
                  underlyingTokenAddress: bufferPool.tokens[1],
                  chain: chainIdToChain[chainId],
              }
            : { decimals: decimals[i], chain: chainIdToChain[chainId] };

        return prismaPoolTokenFactory.build({
            address: _token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            priceRate: formatEther(poolState.tokenRates[i]),
            token,
            chain: chainIdToChain[chainId],
        });
    });

    // transform hook dynamicData values to bigInt and then apply formatEther to them
    const _hookDynamicData = poolState.hook?.dynamicData;
    const hookDynamicData = _hookDynamicData
        ? Object.fromEntries(Object.entries(_hookDynamicData).map(([key, value]) => [key, formatEther(BigInt(value))]))
        : undefined;

    // map pool state to prisma pool using prisma pool factory
    const prismaPool = prismaPoolFactory
        .gyroE({
            id: poolState.poolAddress,
            alpha: formatEther(poolState.paramsAlpha),
            beta: formatEther(poolState.paramsBeta),
            c: formatEther(poolState.paramsC),
            s: formatEther(poolState.paramsS),
            lambda: formatEther(poolState.paramsLambda),
            tauAlphaX: formatUnits(poolState.tauAlphaX, 38),
            tauAlphaY: formatUnits(poolState.tauAlphaY, 38),
            tauBetaX: formatUnits(poolState.tauBetaX, 38),
            tauBetaY: formatUnits(poolState.tauBetaY, 38),
            u: formatUnits(poolState.u, 38),
            v: formatUnits(poolState.v, 38),
            w: formatUnits(poolState.w, 38),
            z: formatUnits(poolState.z, 38),
            dSq: formatUnits(poolState.dSq, 38),
        })
        .build({
            address: poolState.poolAddress,
            protocolVersion,
            tokens,
            dynamicData: {
                swapFee: formatEther(poolState.swapFee),
                aggregateSwapFee: formatEther(poolState.aggregateSwapFee),
                totalShares: formatEther(poolState.totalSupply),
            },
            hook: {
                ...poolState.hook,
                dynamicData: hookDynamicData,
            },
            chain: chainIdToChain[chainId],
        });
    return prismaPool;
}

export function mapStablePoolStateToPrismaPool(
    poolState: StablePool,
    chainId: number,
    protocolVersion: number,
    bufferPools: BufferPool[],
): PrismaPoolAndHookWithDynamic {
    const decimals = poolState.scalingFactors.map((scalingFactor: bigint) =>
        getDecimalsFromScalingFactor(scalingFactor),
    );

    const poolTokens = poolState.tokens.map(
        (token: string, i: number) => new Token(chainId, token as Address, decimals[i]),
    );

    const tokenAmounts = poolTokens.map((token: Token, i: number) =>
        PoolTokenWithRate.fromScale18AmountWithRate(
            token,
            poolState.balancesLiveScaled18[i],
            poolState.tokenRates[i],
            i,
        ),
    );

    // map tokenIn and tokenOut to prisma tokens using prisma token factory
    const tokens = poolState.tokens.map((_token: string, i: number) => {
        const bufferPool = bufferPools.find((bufferPool) =>
            isSameAddress(_token as Address, bufferPool.poolAddress as Address),
        );
        const token = bufferPool
            ? {
                  decimals: decimals[i],
                  unwrapRate: formatUnits(bufferPool.rate, 18 - decimals[i] + bufferPool.decimals[1]),
                  underlyingTokenAddress: bufferPool.tokens[1],
                  chain: chainIdToChain[chainId],
              }
            : { decimals: decimals[i], chain: chainIdToChain[chainId] };
        return prismaPoolTokenFactory.build({
            address: _token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            priceRate: formatEther(poolState.tokenRates[i]),
            token,
            chain: chainIdToChain[chainId],
        });
    });

    // transform hook dynamicData values to bigInt and then apply formatEther to them
    const _hookDynamicData = poolState.hook?.dynamicData;
    const hookDynamicData = _hookDynamicData
        ? Object.fromEntries(Object.entries(_hookDynamicData).map(([key, value]) => [key, formatEther(BigInt(value))]))
        : undefined;

    // map pool state to prisma pool using prisma pool factory
    const prismaPool = prismaPoolFactory.stable(formatUnits(poolState.amp, 3)).build({
        address: poolState.poolAddress,
        protocolVersion,
        tokens,
        dynamicData: {
            swapFee: formatEther(poolState.swapFee),
            aggregateSwapFee: formatEther(poolState.aggregateSwapFee),
            totalShares: formatEther(poolState.totalSupply),
        },
        hook: {
            ...poolState.hook,
            dynamicData: hookDynamicData,
        },
        chain: chainIdToChain[chainId],
    });
    return prismaPool;
}

export function mapWeightedPoolStateToPrismaPool(
    poolState: WeightedPool,
    chainId: number,
    protocolVersion: number,
    bufferPools: BufferPool[],
): PrismaPoolAndHookWithDynamic {
    const decimals = poolState.scalingFactors.map((scalingFactor: bigint) =>
        getDecimalsFromScalingFactor(scalingFactor),
    );

    const poolTokens = poolState.tokens.map(
        (token: string, i: number) => new Token(chainId, token as Address, decimals[i]),
    );

    const tokenAmounts = poolTokens.map((token: Token, i: number) =>
        PoolTokenWithRate.fromScale18AmountWithRate(
            token,
            poolState.balancesLiveScaled18[i],
            poolState.tokenRates[i],
            i,
        ),
    );

    // map tokenIn and tokenOut to prisma tokens using prisma token factory
    const tokens = poolState.tokens.map((_token: string, i: number) => {
        const bufferPool = bufferPools.find((bufferPool) =>
            isSameAddress(_token as Address, bufferPool.poolAddress as Address),
        );
        const token = bufferPool
            ? {
                  decimals: decimals[i],
                  unwrapRate: formatUnits(bufferPool.rate, 18 - decimals[i] + bufferPool.decimals[1]),
                  underlyingTokenAddress: bufferPool.tokens[1],
                  chain: chainIdToChain[chainId],
              }
            : { decimals: decimals[i], chain: chainIdToChain[chainId] };

        return prismaPoolTokenFactory.build({
            address: _token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            token,
            weight: formatUnits(poolState.weights[i], 18),
            priceRate: formatEther(poolState.tokenRates[i]),
            chain: chainIdToChain[chainId],
        });
    });

    // transform hook dynamicData values to bigInt and then apply formatEther to them
    const _hookDynamicData = poolState.hook?.dynamicData;
    const hookDynamicData = _hookDynamicData
        ? Object.fromEntries(Object.entries(_hookDynamicData).map(([key, value]) => [key, formatEther(BigInt(value))]))
        : undefined;

    // map pool state to prisma pool using prisma pool factory
    const prismaPool = prismaPoolFactory.build({
        address: poolState.poolAddress,
        protocolVersion,
        tokens,
        dynamicData: {
            swapFee: formatEther(poolState.swapFee),
            aggregateSwapFee: formatEther(poolState.aggregateSwapFee),
            totalShares: formatEther(poolState.totalSupply),
        },
        hook: {
            ...poolState.hook,
            dynamicData: hookDynamicData,
        },
        chain: chainIdToChain[chainId],
    });
    return prismaPool;
}

export function mapReClammPoolStateToPrismaPool(
    poolState: ReClammPool,
    chainId: number,
    protocolVersion: number,
    bufferPools: BufferPool[],
): PrismaPoolAndHookWithDynamic {
    const decimals = poolState.scalingFactors.map((scalingFactor: bigint) =>
        getDecimalsFromScalingFactor(scalingFactor),
    );

    const poolTokens = poolState.tokens.map(
        (token: string, i: number) => new Token(chainId, token as Address, decimals[i]),
    );

    const tokenAmounts = poolTokens.map((token: Token, i: number) =>
        PoolTokenWithRate.fromScale18AmountWithRate(
            token,
            poolState.balancesLiveScaled18[i],
            poolState.tokenRates[i],
            i,
        ),
    );

    // map tokenIn and tokenOut to prisma tokens using prisma token factory
    const tokens = poolState.tokens.map((_token, i) => {
        const bufferPool = bufferPools.find((bufferPool) =>
            isSameAddress(_token as Address, bufferPool.poolAddress as Address),
        );
        const token = bufferPool
            ? {
                  decimals: decimals[i],
                  unwrapRate: formatUnits(bufferPool.rate, 18 - decimals[i] + bufferPool.decimals[1]),
                  underlyingTokenAddress: bufferPool.tokens[1],
                  chain: chainIdToChain[chainId],
              }
            : { decimals: decimals[i], chain: chainIdToChain[chainId] };

        return prismaPoolTokenFactory.build({
            address: _token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            priceRate: formatEther(poolState.tokenRates[i]),
            token,
            chain: chainIdToChain[chainId],
        });
    });

    // transform hook dynamicData values to bigInt and then apply formatEther to them
    const _hookDynamicData = poolState.hook?.dynamicData;
    const hookDynamicData = _hookDynamicData
        ? Object.fromEntries(Object.entries(_hookDynamicData).map(([key, value]) => [key, formatEther(BigInt(value))]))
        : undefined;

    // map pool state to prisma pool using prisma pool factory
    const prismaPool = prismaPoolFactory
        .reClamm({
            centerednessMargin: formatEther(poolState.centerednessMargin),
            currentFourthRootPriceRatio: '0', // not needed for SOR/balancer-maths which recalculate given other parameters
            endFourthRootPriceRatio: formatEther(poolState.endFourthRootPriceRatio),
            lastTimestamp: Number(poolState.lastTimestamp),
            lastVirtualBalances: poolState.lastVirtualBalances.map((b) => formatEther(b)),
            priceRatioUpdateEndTime: Number(poolState.priceRatioUpdateEndTime),
            priceRatioUpdateStartTime: Number(poolState.priceRatioUpdateStartTime),
            dailyPriceShiftBase: formatEther(poolState.dailyPriceShiftBase),
            startFourthRootPriceRatio: formatEther(poolState.startFourthRootPriceRatio),
        })
        .build({
            address: poolState.poolAddress,
            protocolVersion,
            tokens,
            dynamicData: {
                swapFee: formatEther(poolState.swapFee),
                aggregateSwapFee: formatEther(poolState.aggregateSwapFee),
                totalShares: formatEther(poolState.totalSupply),
            },
            hook: {
                ...poolState.hook,
                dynamicData: hookDynamicData,
            },
            chain: chainIdToChain[chainId],
        });
    return prismaPool;
}

export function mapQuantAmmPoolStateToPrismaPool(
    poolState: QuantAmmPool,
    chainId: number,
    protocolVersion: number,
    bufferPools: BufferPool[],
): PrismaPoolAndHookWithDynamic {
    const decimals = poolState.scalingFactors.map((scalingFactor: bigint) =>
        getDecimalsFromScalingFactor(scalingFactor),
    );

    const poolTokens = poolState.tokens.map(
        (token: string, i: number) => new Token(chainId, token as Address, decimals[i]),
    );

    const tokenAmounts = poolTokens.map((token: Token, i: number) =>
        PoolTokenWithRate.fromScale18AmountWithRate(
            token,
            poolState.balancesLiveScaled18[i],
            poolState.tokenRates[i],
            i,
        ),
    );

    // map tokenIn and tokenOut to prisma tokens using prisma token factory
    const tokens = poolState.tokens.map((_token, i) => {
        const bufferPool = bufferPools.find((bufferPool) =>
            isSameAddress(_token as Address, bufferPool.poolAddress as Address),
        );
        const token = bufferPool
            ? {
                  decimals: decimals[i],
                  unwrapRate: formatUnits(bufferPool.rate, 18 - decimals[i] + bufferPool.decimals[1]),
                  underlyingTokenAddress: bufferPool.tokens[1],
                  chain: chainIdToChain[chainId],
              }
            : { decimals: decimals[i], chain: chainIdToChain[chainId] };

        return prismaPoolTokenFactory.build({
            address: _token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            priceRate: formatEther(poolState.tokenRates[i]),
            token,
            chain: chainIdToChain[chainId],
        });
    });

    // transform hook dynamicData values to bigInt and then apply formatEther to them
    const _hookDynamicData = poolState.hook?.dynamicData;
    const hookDynamicData = _hookDynamicData
        ? Object.fromEntries(Object.entries(_hookDynamicData).map(([key, value]) => [key, formatEther(BigInt(value))]))
        : undefined;

    // map pool state to prisma pool using prisma pool factory
    const prismaPool = prismaPoolFactory
        .quantAmm({
            firstFourWeightsAndMultipliers: poolState.firstFourWeightsAndMultipliers.map((w) => formatEther(w)),
            secondFourWeightsAndMultipliers: poolState.secondFourWeightsAndMultipliers.map((w) => formatEther(w)),
            maxTradeSizeRatio: formatEther(poolState.maxTradeSizeRatio),
            lastUpdateIntervalTime: String(poolState.lastUpdateTime),
            lastInterpolationTimePossible: String(poolState.lastInteropTime),
        })
        .build({
            address: poolState.poolAddress,
            protocolVersion,
            tokens,
            dynamicData: {
                swapFee: formatEther(poolState.swapFee),
                aggregateSwapFee: formatEther(poolState.aggregateSwapFee),
                totalShares: formatEther(poolState.totalSupply),
            },
            hook: {
                ...poolState.hook,
                dynamicData: hookDynamicData,
            },
            chain: chainIdToChain[chainId],
        });
    return prismaPool;
}
