import { WeightedPool } from './weightedPool';
import { prismaPoolDynamicDataFactory, prismaPoolFactory } from '../../../../../../test/factories/prismaPool.factory';
import { RemoveLiquidityKind, SwapKind, Token } from '@balancer/sdk';
import {
    prismaPoolTokenDynamicDataFactory,
    prismaPoolTokenFactory,
} from '../../../../../../test/factories/prismaToken.factory';
import { parseEther } from 'viem';
import { chainToIdMap } from '../../../../../network/network-config';

describe('SOR V3 Weighted Pool Tests', () => {
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
        vaultVersion: 3,
        tokens: [token1, token2],
        dynamicData: prismaPoolDynamicDataFactory.build({ totalShares: '156' }),
    });
    const weightedPool = WeightedPool.fromPrismaPool(prismaWeightedPool);
    const bpt = new Token(
        parseFloat(chainToIdMap[prismaWeightedPool.chain]),
        weightedPool.address as `0x${string}`,
        18,
    );
    test('Swap Limits with Given In', () => {
        const limitAmountIn = weightedPool.getLimitAmountSwap(
            weightedPool.tokens[0].token,
            weightedPool.tokens[1].token,
            SwapKind.GivenIn,
        );
        expect(limitAmountIn).toBe(parseEther('169'));
    });
    test('Swap Limits with Given Out', () => {
        const limitAmountIn = weightedPool.getLimitAmountSwap(
            weightedPool.tokens[0].token,
            weightedPool.tokens[1].token,
            SwapKind.GivenOut,
        );
        expect(limitAmountIn).toBe(parseEther('144'));
    });
});
