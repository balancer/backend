// yarn vitest weightedPool.test.ts

import { WeightedPool } from './weightedPool';
import {
    prismaPoolTokenDynamicDataFactory,
    prismaPoolTokenFactory,
    prismaPoolDynamicDataFactory,
    prismaPoolFactory,
} from '../../../../../../test/factories';
import { SwapKind, WAD } from '@balancer/sdk';
import { parseEther } from 'viem';

describe('SOR V3 Weighted Pool Tests', () => {
    let weightedPool: WeightedPool;
    beforeAll(() => {
        const token1Balance = '169';
        const token1 = prismaPoolTokenFactory.build({
            dynamicData: prismaPoolTokenDynamicDataFactory.build({ balance: token1Balance }),
        });
        const token2Balance = '144';
        const token2 = prismaPoolTokenFactory.build({
            dynamicData: prismaPoolTokenDynamicDataFactory.build({ balance: token2Balance }),
        });

        const prismaWeightedPool = prismaPoolFactory.build({
            type: 'WEIGHTED',
            protocolVersion: 3,
            tokens: [token1, token2],
            dynamicData: prismaPoolDynamicDataFactory.build({ totalShares: '156' }),
        });
        weightedPool = WeightedPool.fromPrismaPool(prismaWeightedPool);
    });

    test('Swap Limits with Given In', () => {
        const limitAmountIn = weightedPool.getLimitAmountSwap(
            weightedPool.tokens[0].token,
            weightedPool.tokens[1].token,
            SwapKind.GivenIn,
        );
        expect(limitAmountIn).toBe((parseEther('169') * weightedPool.MAX_IN_RATIO) / WAD);
    });
    test('Swap Limits with Given Out', () => {
        const limitAmountIn = weightedPool.getLimitAmountSwap(
            weightedPool.tokens[0].token,
            weightedPool.tokens[1].token,
            SwapKind.GivenOut,
        );
        expect(limitAmountIn).toBe((parseEther('144') * weightedPool.MAX_OUT_RATIO) / WAD);
    });
});
