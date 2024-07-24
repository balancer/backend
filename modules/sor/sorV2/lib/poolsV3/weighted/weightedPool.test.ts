// yarn vitest poolsV3/weighted/weightedPool.test.ts

import { parseEther, parseUnits } from 'viem';
import { Address, SwapKind, Token } from '@balancer/sdk';

import { PrismaPoolWithDynamic } from '../../../../../../prisma/prisma-types';
import { chainToIdMap } from '../../../../../network/network-config';
import { sorGetPathsWithPools } from '../../static';
import { WAD } from '../../utils/math';
import { WeightedPoolV3 } from './weightedPool';

// keep factories imports at the end - moving up will break the test
import {
    poolTokenFactory,
    prismaPoolDynamicDataFactory,
    prismaPoolFactory,
    prismaPoolTokenDynamicDataFactory,
    prismaPoolTokenFactory,
} from '../../../../../../test/factories';

describe('SOR V3 Weighted Pool Tests', () => {
    let scalingFactors: bigint[];
    let swapFee: string;
    let tokenAddresses: string[];
    let tokenBalances: string[];
    let tokenDecimals: number[];
    let tokenWeights: string[];
    let totalShares: string;
    let weightedPool: WeightedPoolV3;
    let weightedPrismaPool: PrismaPoolWithDynamic;

    beforeAll(() => {
        swapFee = '0.01';
        tokenBalances = ['169', '144'];
        tokenDecimals = [6, 18];
        tokenWeights = ['0.4', '0.6'];
        totalShares = '156';
        scalingFactors = [WAD * 10n ** 12n, WAD];

        const poolToken1 = prismaPoolTokenFactory.build({
            token: poolTokenFactory.build({ decimals: tokenDecimals[0] }),
            dynamicData: prismaPoolTokenDynamicDataFactory.build({
                balance: tokenBalances[0],
                weight: tokenWeights[0],
            }),
        });
        const poolToken2 = prismaPoolTokenFactory.build({
            token: poolTokenFactory.build({ decimals: tokenDecimals[1] }),
            dynamicData: prismaPoolTokenDynamicDataFactory.build({
                balance: tokenBalances[1],
                weight: tokenWeights[1],
            }),
        });

        tokenAddresses = [poolToken1.address, poolToken2.address];

        weightedPrismaPool = prismaPoolFactory.build({
            type: 'WEIGHTED',
            protocolVersion: 3,
            tokens: [poolToken1, poolToken2],
            dynamicData: prismaPoolDynamicDataFactory.build({ swapFee, totalShares }),
        });
        weightedPool = WeightedPoolV3.fromPrismaPool(weightedPrismaPool);
    });

    test('Get Pool State', () => {
        const poolState = {
            poolType: 'Weighted',
            swapFee: parseEther(swapFee),
            balancesLiveScaled18: tokenBalances.map((b) => parseEther(b)),
            tokenRates: Array(tokenBalances.length).fill(WAD),
            totalSupply: parseEther(totalShares),
            weights: tokenWeights.map((w) => parseEther(w)),
            tokens: tokenAddresses,
            scalingFactors,
        };
        expect(poolState).toEqual(weightedPool.getPoolState());
    });

    describe('swap tests', () => {
        let tIn: Token;
        let tOut: Token;

        beforeAll(() => {
            tIn = new Token(parseFloat(chainToIdMap['SEPOLIA']), tokenAddresses[0] as Address, tokenDecimals[0]);
            tOut = new Token(parseFloat(chainToIdMap['SEPOLIA']), tokenAddresses[1] as Address, tokenDecimals[1]);
        });

        test('should find paths - given in', async () => {
            const paths = await sorGetPathsWithPools(tIn, tOut, SwapKind.GivenIn, parseUnits('0.1', tokenDecimals[0]), [
                weightedPrismaPool,
            ]);
            expect(paths).not.toBeNull();
        });

        test('should find paths - given out', async () => {
            const paths = await sorGetPathsWithPools(tIn, tOut, SwapKind.GivenOut, parseUnits('0.1', tOut.decimals), [
                weightedPrismaPool,
            ]);
            expect(paths).not.toBeNull();
        });
    });
});
