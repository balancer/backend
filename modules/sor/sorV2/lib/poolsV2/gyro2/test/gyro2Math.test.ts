import { _calculateInvariant, _calcOutGivenIn, _findVirtualParams } from "../gyro2Math";
import { Gyro2Pool, Gyro2PoolToken } from "../gyro2Pool"; 

import { Token, TokenAmount } from '@balancer/sdk'

import { parseEther } from 'viem';

// yarn vitest gyro2Math.test.ts

describe('gyro2Math', () => {
    it('should swap given In with rate', async () => {
        // https://dashboard.tenderly.co/mkflow27/balancer/simulator/49dae9b5-e77c-4760-bd11-577bfd3c2638?trace=0.0.0.0.2.2.1.5.6
        // this test uses onchain data from an Arbitrum one simulation. Block 257426306
        // with the following payload
        /*  "singleSwap": {
            "poolId": "0x14abd18d1fa335e9f630a658a2799b33208763fa00020000000000000000051f",
            "kind": 0,
            "assetIn": "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            "assetOut": "0xb165a74407fe1e519d6bcbdec1ed3202b35a4140",
            "amount": "1000000",
            "userData": "0x"
        } */
        // simulated amount out is 879697 taken from the tenderly simulation
        const expectedAmountOut = 879697n;

        // Create dummy tokens
        const tokenIn = new Token(1, '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', 6, 'TKN1', 'Token 1');
        const tokenOut = new Token(1, '0xb165a74407fe1e519d6bcbdec1ed3202b35a4140', 6, 'TKN2', 'Token 2');

        // Create Gyro2PoolTokens (pool balances, index and rate)
        const gyro2PoolTokenIn = new Gyro2PoolToken(tokenIn, 54239799503n, 0, 1000000000000000000n);
        // rate reported by rate provider at the block 257426306 (pool balances, index and rate)
        const gyro2PoolTokenOut = new Gyro2PoolToken(tokenOut, 43760092936n, 1, 1136743822319391825n);

        // Initialize the pool with tokens and other parameters
        const pool = new Gyro2Pool(
            '0xPoolId',
            '0xPoolAddress',
            'ARBITRUM',
            2,
            parseEther('0.000005'), //swap fee
            parseEther('0.999949998749937496'), //sqrtAlpha
            parseEther('1.000049998750062496'), //sqrtBeta
            [gyro2PoolTokenIn, gyro2PoolTokenOut],
            [{ tokenA: '0xTokenInAddress', tokenB: '0xTokenOutAddress', normalizedLiquidity: '1000000', spotPrice: '1.5' }]
        );

        const tIn = new Token(
            42161,
            "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            6,
            "USDT",
            "Tether USD",
            "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
          )

        const tOut = new Token(
            42161,
            "0xb165a74407fe1e519d6bcbdec1ed3202b35a4140",
            6,
            "stataArbUSDT",
            "Static Aave Arbitrum USDT",
            "0xb165a74407fe1e519d6bcbdec1ed3202b35a4140",
        )
        
        const swapAmount = TokenAmount.fromHumanAmount(tIn, '1');

        const swapAmountOut = pool.swapGivenIn(tIn, tOut, swapAmount, false);
        const simAndCalcDifference = swapAmountOut.amount - expectedAmountOut;
        expect(simAndCalcDifference).toBeLessThan(5n);
    });
    it('should swap Given out with rate', async () => {
        // Based on sim from block 257426306
        // https://dashboard.tenderly.co/mkflow27/balancer/simulator/adec1171-fb7c-41ea-bf42-d21fc57ac2ca
        /*  "singleSwap": {
            "poolId":"0x14abd18d1fa335e9f630a658a2799b33208763fa00020000000000000000051f",
            "kind":"0",
            "assetIn":"0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            "assetOut":"0xb165a74407fe1e519d6bcbdec1ed3202b35a4140",
            "amount":"879697",
            "userData":"0x"
        } */

        const expectedAmountOut = 1000003n;

        // Create dummy tokens
        const tokenIn = new Token(1, '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', 6, 'TKN1', 'Token 1');
        const tokenOut = new Token(1, '0xb165a74407fe1e519d6bcbdec1ed3202b35a4140', 6, 'TKN2', 'Token 2');

        // Create Gyro2PoolTokens (pool balances, index and rate) based on sim from block 257426306
        const gyro2PoolTokenIn = new Gyro2PoolToken(tokenIn, 54239799503n, 0, 1000000000000000000n);
        const gyro2PoolTokenOut = new Gyro2PoolToken(tokenOut, 43760092936n, 1, 1136746115124948941n);

        // Initialize the pool with dummy tokens and other parameters
        const pool = new Gyro2Pool(
            '0xPoolId',
            '0xPoolAddress',
            'ARBITRUM',
            2,
            parseEther('0.000005'),
            parseEther('0.999949998749937496'),
            parseEther('1.000049998750062496'),
            [gyro2PoolTokenIn, gyro2PoolTokenOut],
            [{ tokenA: '0xTokenInAddress', tokenB: '0xTokenOutAddress', normalizedLiquidity: '1000000', spotPrice: '1.5' }]
        );

        const tIn = new Token(
            42161,
            "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            6,
            "USDT",
            "Tether USD",
            "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
          )

        const tOut = new Token(
            42161,
            "0xb165a74407fe1e519d6bcbdec1ed3202b35a4140",
            6,
            "stataArbUSDT",
            "Static Aave Arbitrum USDT",
            "0xb165a74407fe1e519d6bcbdec1ed3202b35a4140",
        )
        const swapAmount = TokenAmount.fromHumanAmount(tIn, '0.879697');

        const swapAmountOut = pool.swapGivenOut(
            tIn,
            tOut,
            swapAmount,
            false
        )
        const simAndCalcDifference = swapAmountOut.amount - expectedAmountOut;
        expect(simAndCalcDifference).toBeLessThan(5n);
    })

});