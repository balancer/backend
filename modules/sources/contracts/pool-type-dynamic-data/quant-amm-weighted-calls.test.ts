import { describe, it, expect } from 'vitest';
import { extractWeightsAndMultipliers } from './quant-amm-weighted-calls';

describe('extractWeightsAndMultipliers', () => {
    describe('when tokensLength <= 4', () => {
        it('should handle a pool with 2 tokens correctly', () => {
            const tokensLength = 2;
            const firstFourWeightsAndMultipliers = ['1', '2', '10', '20', '0', '0', '0', '0'];
            const secondFourWeightsAndMultipliers = ['0', '0', '0', '0', '0', '0', '0', '0'];

            const result = extractWeightsAndMultipliers(
                tokensLength,
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
            );

            expect(result).toEqual([
                [
                    ['1', '2', '0', '0'],
                    ['10', '20', '0', '0'],
                ],
                [
                    ['0', '0', '0', '0'],
                    ['0', '0', '0', '0'],
                ],
            ]);
        });

        it('should handle a pool with 3 tokens correctly', () => {
            const tokensLength = 3;
            const firstFourWeightsAndMultipliers = ['1', '2', '3', '10', '20', '30', '0', '0'];
            const secondFourWeightsAndMultipliers = ['0', '0', '0', '0', '0', '0', '0', '0'];

            const result = extractWeightsAndMultipliers(
                tokensLength,
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
            );

            expect(result).toEqual([
                [
                    ['1', '2', '3', '0'],
                    ['10', '20', '30', '0'],
                ],
                [
                    ['0', '0', '0', '0'],
                    ['0', '0', '0', '0'],
                ],
            ]);
        });

        it('should handle a pool with 4 tokens correctly', () => {
            const tokensLength = 4;
            const firstFourWeightsAndMultipliers = ['1', '2', '3', '4', '10', '20', '30', '40'];
            const secondFourWeightsAndMultipliers = ['0', '0', '0', '0', '0', '0', '0', '0'];

            const result = extractWeightsAndMultipliers(
                tokensLength,
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
            );

            // Expected output:
            // weightsA: [1, 2, 3, 4] (no padding needed)
            // multipliersA: [10, 20, 30, 40]
            // weightsB: [5, 6, 7, 8] (no padding needed)
            // multipliersB: [50, 60, 70, 80]
            expect(result).toEqual([
                [
                    ['1', '2', '3', '4'],
                    ['10', '20', '30', '40'],
                ],
                [
                    ['0', '0', '0', '0'],
                    ['0', '0', '0', '0'],
                ],
            ]);
        });
    });

    describe('when tokensLength > 4', () => {
        it('should handle a pool with 5 tokens correctly', () => {
            const tokensLength = 5;
            const firstFourWeightsAndMultipliers = ['1', '2', '3', '4', '10', '20', '30', '40'];
            const secondFourWeightsAndMultipliers = ['5', '50', '0', '0', '0', '0', '0', '0'];

            const result = extractWeightsAndMultipliers(
                tokensLength,
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
            );

            expect(result).toEqual([
                [
                    ['1', '2', '3', '4'],
                    ['10', '20', '30', '40'],
                ],
                [
                    ['5', '0', '0', '0'],
                    ['50', '0', '0', '0'],
                ],
            ]);
        });

        it('should handle a pool with 7 tokens correctly', () => {
            const tokensLength = 7;
            const firstFourWeightsAndMultipliers = ['1', '2', '3', '4', '10', '20', '30', '40'];
            const secondFourWeightsAndMultipliers = ['5', '6', '7', '50', '60', '70', '0', '0'];

            const result = extractWeightsAndMultipliers(
                tokensLength,
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
            );

            expect(result).toEqual([
                [
                    ['1', '2', '3', '4'],
                    ['10', '20', '30', '40'],
                ],
                [
                    ['5', '6', '7', '0'],
                    ['50', '60', '70', '0'],
                ],
            ]);
        });

        it('should handle a pool with 8 tokens correctly', () => {
            const tokensLength = 8;
            const firstFourWeightsAndMultipliers = ['1', '2', '3', '4', '10', '20', '30', '40'];
            const secondFourWeightsAndMultipliers = ['5', '6', '7', '8', '50', '60', '70', '80'];

            const result = extractWeightsAndMultipliers(
                tokensLength,
                firstFourWeightsAndMultipliers,
                secondFourWeightsAndMultipliers,
            );

            expect(result).toEqual([
                [
                    ['1', '2', '3', '4'],
                    ['10', '20', '30', '40'],
                ],
                [
                    ['5', '6', '7', '8'],
                    ['50', '60', '70', '80'],
                ],
            ]);
        });
    });
});
