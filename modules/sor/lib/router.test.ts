import { SwapKind, Token, TokenAmount } from '@balancer/sdk';
import { parseEther } from 'viem';

import { Router } from './router';
import { PathLocal, PathWithAmount } from './path';
import { BufferPool } from './poolsV3/buffer/bufferPool';
import { BasePoolToken } from './utils/basePoolToken';

/**
 * Regression scenario: a boosted pool swap that requires wrapping more underlying than the
 * lending protocol accepts (erc4626 maxDeposit almost exhausted, e.g. an Aave market at its
 * supply cap). The SOR used to quote these paths anyway and the swap reverted onchain with
 * an opaque EstimateGasExecutionError.
 */
describe('Router buffer capacity limits', () => {
    const chainId = 1;
    const underlying = new Token(chainId, '0x000000000000000000000000000000000000aaa1', 6);
    const wrapped = new Token(chainId, '0x000000000000000000000000000000000000bbb1', 6);

    // buffer holds 100/100, lending protocol has room for 696.89 more underlying
    const bufferBalance = 100_000000n;
    const maxDeposit = 696_890000n;
    const maxWithdraw = 1_000_000_000000n;

    function createBufferPool(): BufferPool {
        return new BufferPool(
            '0x000000000000000000000000000000000000bbb1',
            '0x000000000000000000000000000000000000bbb1',
            chainId,
            parseEther('1'), // 1:1 unwrap rate
            new BasePoolToken(wrapped, bufferBalance, 0),
            new BasePoolToken(underlying, bufferBalance, 1),
            maxDeposit,
            maxWithdraw,
        );
    }

    function createWrapPath(): PathLocal {
        return new PathLocal([underlying, wrapped], [createBufferPool()], [true]);
    }

    describe('PathWithAmount.swapStepsExceedingBufferCapacity', () => {
        it('flags a wrap that exceeds the lending protocol deposit capacity', () => {
            const path = createWrapPath();
            const swapAmount = TokenAmount.fromRawAmount(underlying, 699_729300n);

            const pathWithAmount = new PathWithAmount(path.tokens, path.pools, path.isBuffer, swapAmount);

            expect(pathWithAmount.swapStepsExceedingBufferCapacity).toBe(1);
        });

        it('does not flag a wrap within the deposit capacity', () => {
            const path = createWrapPath();
            const swapAmount = TokenAmount.fromRawAmount(underlying, 690_000000n);

            const pathWithAmount = new PathWithAmount(path.tokens, path.pools, path.isBuffer, swapAmount);

            expect(pathWithAmount.swapStepsExceedingBufferCapacity).toBe(0);
        });
    });

    describe('Router.getBestPaths', () => {
        it('returns no paths when the only path exceeds buffer capacity', () => {
            const router = new Router();
            const swapAmount = TokenAmount.fromRawAmount(underlying, 699_729300n);

            const bestPaths = router.getBestPaths([createWrapPath()], SwapKind.GivenIn, swapAmount);

            expect(bestPaths).toBeNull();
        });

        it('returns a quote when the swap is within buffer capacity', () => {
            const router = new Router();
            const swapAmount = TokenAmount.fromRawAmount(underlying, 690_000000n);

            const bestPaths = router.getBestPaths([createWrapPath()], SwapKind.GivenIn, swapAmount);

            expect(bestPaths).not.toBeNull();
            expect(bestPaths![0].outputAmount.amount).toBe(690_000000n);
        });

        it('returns no paths when a givenOut swap exceeds buffer capacity', () => {
            const router = new Router();
            // givenOut wrap limit = buffer wrapped balance + maxDeposit room = 100 + 696.89
            const swapAmount = TokenAmount.fromRawAmount(wrapped, 800_000000n);

            const bestPaths = router.getBestPaths([createWrapPath()], SwapKind.GivenOut, swapAmount);

            expect(bestPaths).toBeNull();
        });
    });
});
