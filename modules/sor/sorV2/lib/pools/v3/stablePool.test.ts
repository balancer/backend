// yarn vitest stablePool.test.ts

import { parseEther, parseUnits } from 'viem';
import { SwapKind, WAD } from '@balancer/sdk';

import {
    poolTokenFactory,
    prismaPoolDynamicDataFactory,
    prismaPoolFactory,
    prismaPoolTokenDynamicDataFactory,
    prismaPoolTokenFactory,
} from '../../../../../../test/factories';
import { StablePool } from './stablePool';

describe('SOR V3 Weighted Pool Tests', () => {
    let stablePool: StablePool;
    let swapFee: string;
    let tokenAddresses: string[];
    let tokenBalances: string[];
    let tokenDecimals: number[];
    let tokenRates: string[];
    let totalShares: string;
    let amp: string;
    let scalingFactors: bigint[];

    beforeAll(() => {
        swapFee = '0.01';
        tokenBalances = ['169', '144'];
        tokenDecimals = [6, 18];
        tokenRates = ['1', '1'];
        totalShares = '156';
        amp = '10';
        scalingFactors = [WAD * 10n ** 12n, WAD];

        const poolToken1 = prismaPoolTokenFactory.build({
            token: poolTokenFactory.build({ decimals: tokenDecimals[0] }),
            dynamicData: prismaPoolTokenDynamicDataFactory.build({
                balance: tokenBalances[0],
                priceRate: tokenRates[0],
            }),
        });
        const poolToken2 = prismaPoolTokenFactory.build({
            token: poolTokenFactory.build({ decimals: tokenDecimals[1] }),
            dynamicData: prismaPoolTokenDynamicDataFactory.build({
                balance: tokenBalances[1],
                priceRate: tokenRates[1],
            }),
        });

        tokenAddresses = [poolToken1.address, poolToken2.address];

        const prismaStablePool = prismaPoolFactory.build({
            type: 'STABLE',
            protocolVersion: 3,
            typeData: {
                amp,
            },
            tokens: [poolToken1, poolToken2],
            dynamicData: prismaPoolDynamicDataFactory.build({ swapFee, totalShares }),
        });
        stablePool = StablePool.fromPrismaPool(prismaStablePool);
    });

    test('Get Pool State', () => {
        const poolState = {
            poolType: 'Stable',
            swapFee: parseEther(swapFee),
            balancesLiveScaled18: tokenBalances.map((b) => parseEther(b)),
            tokenRates: tokenRates.map((r) => parseEther(r)),
            totalSupply: parseEther(totalShares),
            amp: parseUnits(amp, 3),
            tokens: tokenAddresses,
            scalingFactors,
        };
        expect(poolState).toEqual(stablePool.getPoolState());
    });
});
