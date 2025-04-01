// bun run vitest weightedPool.integration.test.ts

import { isSameAddress, SwapKind, Token } from '@balancer/sdk';
import { Address, formatEther, formatUnits } from 'viem';

import { PathWithAmount } from '../../path';
import { SOR } from '../../sor';
import { getOutputAmount, getInputAmount } from '../../utils/helpers';

import { WeightedPool, readTestData } from '../../../../../test/testData/readTestData';
import { chainToChainId as chainToIdMap } from '../../../../network/chain-id-to-chain';
import { prismaPoolFactory, prismaPoolTokenFactory } from '../../../../../test/factories';
import { getDecimalsFromScalingFactor } from '../../../../../test/utils';
import { BasePoolToken } from '../../utils';

const protocolVersion = 3;
const weightedData = readTestData('11155111-7439300-Weighted-USDC-DAI.json');
const chainId = parseFloat(chainToIdMap['SEPOLIA']);

describe('SOR V3 - WeightedPool Integration Tests', () => {
    describe('Swaps', () => {
        test.each(weightedData.swaps)('$test $swapKind $amount', async (swap) => {
            const { test, amountRaw, tokenIn, tokenOut, outputRaw, swapKind } = swap;

            const poolState = weightedData.pools.get(test) as WeightedPool;

            const { tokenAmounts, prismaPool } = mapWeightedPoolStateToPrismaPool(poolState);

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

function mapWeightedPoolStateToPrismaPool(poolState: WeightedPool) {
    const decimals = poolState.scalingFactors.map((scalingFactor: bigint) =>
        getDecimalsFromScalingFactor(scalingFactor),
    );

    const tokenAmounts = poolState.tokens.map((token: string, i: number) =>
        BasePoolToken.fromScale18Amount(
            new Token(chainId, token as Address, decimals[i]),
            poolState.balancesLiveScaled18[i],
        ),
    );

    // map tokenIn and tokenOut to prisma tokens using prisma token factory
    const tokens = poolState.tokens.map((token: string, i: number) =>
        prismaPoolTokenFactory.build({
            address: token as Address,
            balance: formatUnits(tokenAmounts[i].amount, decimals[i]),
            index: i,
            token: { decimals: decimals[i] },
            weight: formatUnits(poolState.weights[i], 18),
        }),
    );

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
    return { tokenAmounts, prismaPool };
}
