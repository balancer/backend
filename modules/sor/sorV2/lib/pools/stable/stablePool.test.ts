import {
    prismaPoolTokenDynamicDataFactory,
    prismaPoolTokenFactory,
} from '../../../../../../test/factories/prismaToken.factory';
import { prismaPoolDynamicDataFactory, prismaPoolFactory } from '../../../../../../test/factories/prismaPool.factory';
import { SwapKind, Token } from '@balancer/sdk';
import { parseEther } from 'viem';
import { StablePool } from './stablePool';

describe('SOR V3 Stable Pool Tests', () => {
    const token1Balance = '100';
    const token1 = prismaPoolTokenFactory.build({
        index: 0,
        dynamicData: prismaPoolTokenDynamicDataFactory.build({ balance: token1Balance, priceRate: '2' }),
    });
    const token2Balance = '100';
    const token2 = prismaPoolTokenFactory.build({
        index: 1,
        dynamicData: prismaPoolTokenDynamicDataFactory.build({ balance: token2Balance, priceRate: '4' }),
    });

    const prismaStablePool = prismaPoolFactory.build({
        type: 'STABLE',
        vaultVersion: 3,
        tokens: [token1, token2],
        typeData: { amp: '1' },
        dynamicData: prismaPoolDynamicDataFactory.build({ totalShares: '100' }),
    });
    const stablePool = StablePool.fromPrismaPool(prismaStablePool);
    const bpt = new Token(11155111, stablePool.address as `0x${string}`, 18);
    test('Swap Limits with Given In', () => {
        const limitAmountIn = stablePool.getLimitAmountSwap(
            stablePool.tokens[0].token,
            stablePool.tokens[1].token,
            SwapKind.GivenIn,
        );
        expect(limitAmountIn).toBe(parseEther('200'));
    });
    test('Swap Limits with Given Out', () => {
        const limitAmountIn = stablePool.getLimitAmountSwap(
            stablePool.tokens[0].token,
            stablePool.tokens[1].token,
            SwapKind.GivenOut,
        );
        expect(limitAmountIn).toBe(parseEther('400'));
    });
});
