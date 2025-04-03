import { Address, formatEther, formatUnits } from 'viem';
import { Token } from '@balancer/sdk';

import { BasePoolToken, PoolTokenWithRate } from '../../../modules/sor/lib/utils';
import { PrismaPoolAndHookWithDynamic } from '../../../prisma/prisma-types';
import { prismaPoolFactory, prismaPoolTokenFactory } from '../../factories';
import { getDecimalsFromScalingFactor } from '../../utils';
import { BufferPool, GyroEPool, StablePool, WeightedPool } from './readTestData';

export function mapGyroPoolStateToPrismaPool(
    poolState: GyroEPool,
    chainId: number,
    protocolVersion: number,
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
    const tokens = poolState.tokens.map((token, i) =>
        prismaPoolTokenFactory.build({
            address: token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            priceRate: formatEther(poolState.tokenRates[i]),
            token: { decimals: decimals[i] },
        }),
    );

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
        });
    return prismaPool;
}

export function mapStablePoolStateToPrismaPool(
    poolState: StablePool,
    chainId: number,
    protocolVersion: number,
    bufferPools: (BufferPool & { underlyingTokenDecimals: number })[],
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
        const bufferPool = bufferPools.find((bufferPool) => bufferPool.poolAddress === _token);
        const token = bufferPool
            ? {
                  decimals: decimals[i],
                  unwrapRate: formatUnits(bufferPool.rate, 18 - decimals[i] + bufferPool.underlyingTokenDecimals),
                  underlyingTokenAddress: bufferPool.tokens[1],
              }
            : { decimals: decimals[i] };
        return prismaPoolTokenFactory.build({
            address: _token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            priceRate: formatEther(poolState.tokenRates[i]),
            token,
        });
    });

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
    });
    return prismaPool;
}

export function mapWeightedPoolStateToPrismaPool(
    poolState: WeightedPool,
    chainId: number,
    protocolVersion: number,
    bufferPools: (BufferPool & { underlyingTokenDecimals: number })[],
): PrismaPoolAndHookWithDynamic {
    const decimals = poolState.scalingFactors.map((scalingFactor: bigint) =>
        getDecimalsFromScalingFactor(scalingFactor),
    );

    const poolTokens = poolState.tokens.map(
        (token: string, i: number) => new Token(chainId, token as Address, decimals[i]),
    );

    const tokenAmounts = poolTokens.map((token: Token, i: number) =>
        BasePoolToken.fromScale18Amount(token, poolState.balancesLiveScaled18[i]),
    );

    // map tokenIn and tokenOut to prisma tokens using prisma token factory
    const tokens = poolState.tokens.map((_token: string, i: number) => {
        const bufferPool = bufferPools.find((bufferPool) => bufferPool.poolAddress === _token);
        const token = bufferPool
            ? {
                  decimals: decimals[i],
                  unwrapRate: formatUnits(bufferPool.rate, 18 - decimals[i] + bufferPool.underlyingTokenDecimals),
                  underlyingTokenAddress: bufferPool.tokens[1],
              }
            : { decimals: decimals[i] };

        return prismaPoolTokenFactory.build({
            address: _token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            token,
            weight: formatUnits(poolState.weights[i], 18),
        });
    });

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
    });
    return prismaPool;
}
