// bun run vitest gyroECLPPool.integration.test.ts

import { isSameAddress, SwapKind, Token } from '@balancer/sdk';
import { Address, formatEther, formatUnits } from 'viem';

import { PathWithAmount } from '../../path';
import { SOR } from '../../sor';
import { getOutputAmount, getInputAmount } from '../../utils/helpers';

import { GyroEPool, readTestData } from '../../../../../test/testData/readTestData';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';
import { prismaPoolFactory, prismaPoolTokenFactory } from '../../../../../test/factories';
import { getDecimalsFromScalingFactor } from '../../../../../test/utils';
import { PoolTokenWithRate } from '../../utils';

const protocolVersion = 3;
const gyroECLPData = readTestData('11155111-7748718-GyroECLP.json');
const chainId = parseFloat(chainToIdMap['SEPOLIA']);

describe('SOR V3 - GyroECLP Integration Tests', () => {
    describe('Swaps', () => {
        test.each(gyroECLPData.swaps)('$test $swapKind $amount', async (swap) => {
            const { test, amountRaw, tokenIn, tokenOut, outputRaw, swapKind } = swap;

            const poolState = gyroECLPData.pools.get(test) as GyroEPool;

            const { tokenAmounts, prismaPool } = mapGyroPoolStateToPrismaPool(poolState);

            const paths = (await SOR.getPathsWithPools(
                tokenAmounts[poolState.tokens.findIndex((t) => isSameAddress(t as Address, tokenIn as Address))].token,
                tokenAmounts[poolState.tokens.findIndex((t) => isSameAddress(t as Address, tokenOut as Address))].token,
                swapKind,
                amountRaw,
                [prismaPool],
                [],
                protocolVersion,
            )) as PathWithAmount[];

            const returnAmountSOR = swapKind === SwapKind.GivenIn ? getOutputAmount(paths) : getInputAmount(paths);
            expect(outputRaw).toBe(returnAmountSOR.amount);
        });
    });
});

function mapGyroPoolStateToPrismaPool(poolState: GyroEPool) {
    const decimals = poolState.scalingFactors.map((scalingFactor: bigint) =>
        getDecimalsFromScalingFactor(scalingFactor),
    );

    const tokenAmounts = poolState.tokens.map((token, i) =>
        PoolTokenWithRate.fromScale18AmountWithRate(
            new Token(chainId, token as Address, decimals[i]),
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
    return { tokenAmounts, prismaPool };
}
