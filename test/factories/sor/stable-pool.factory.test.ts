import { parseEther, parseUnits } from 'viem';
import { StablePoolFactory } from './stable-pool.factory';
import { StablePoolV3 } from '../../../modules/sor/lib/poolsV3/stable/stablePool';
import { Token, TokenAmount } from '@balancer/sdk';
import { PoolTokenWithRate } from '../../../modules/sor/lib/utils/poolTokenWithRate';

describe('SOR Stable pool factory', () => {
    it('Create Stable Pool', () => {
        const pool = StablePoolFactory.build();
        expect(pool).toBeInstanceOf(StablePoolV3);
    });

    it('creates a StablePool with overridden values', () => {
        const token = new Token(1, '0xCustomTokenAddress', 18, 'CUS', 'Custom Token');
        const tokenAmount = TokenAmount.fromHumanAmount(token, '5000');
        const customToken = new PoolTokenWithRate(token, tokenAmount.amount, 0, parseEther('1.0'));

        const stablePool = StablePoolFactory.build({
            id: '0xCustomId',
            address: '0xCustomAddress',
            chain: 'MAINNET',
            amp: parseUnits('300', 3),
            swapFee: parseEther('0.001'),
            totalShares: parseEther('500000'),
            tokens: [customToken],
            tokenPairs: [
                {
                    tokenA: '0xCustomTokenAddress',
                    tokenB: '0xAnotherCustomTokenAddress',
                    normalizedLiquidity: '1000000',
                    spotPrice: '500',
                },
            ],
        });

        console.log(stablePool);
        expect(stablePool).toBeInstanceOf(StablePoolV3);
        expect(stablePool.id).toBe('0xCustomId');
        expect(stablePool.address).toBe('0xCustomAddress');
        expect(stablePool.tokens[0].token.address).toBe('0xcustomtokenaddress');
        // Further assertions based on the overridden properties
    });
});
