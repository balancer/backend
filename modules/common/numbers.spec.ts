import { describe, it, expect } from 'vitest';
import { weiToFloat, floatToExactString } from './numbers';

describe('weiToFloat', () => {
    it('should convert wei string to float using specified decimals', () => {
        expect(weiToFloat('1000000000000000000', 18)).toBe(1);
        expect(weiToFloat('1500000000000000000', 18)).toBe(1.5);
        expect(weiToFloat('123000000', 6)).toBe(123);
    });

    it('should convert wei bigint to float using specified decimals', () => {
        expect(weiToFloat(BigInt('1000000000000000000'), 18)).toBe(1);
        expect(weiToFloat(BigInt('500000000000000000'), 18)).toBe(0.5);
    });

    it('should return 0 for null or undefined values', () => {
        expect(weiToFloat(null as unknown as string, 18)).toBe(0);
        expect(weiToFloat(undefined as unknown as string, 18)).toBe(0);
    });

    it('should parse string with decimal point directly', () => {
        expect(weiToFloat('1.5', 18)).toBe(1.5);
        expect(weiToFloat('0.123', 18)).toBe(0.123);
    });
});
describe('floatToExactString', () => {
    it('should format float numbers as strings without scientific notation', () => {
        expect(floatToExactString(1)).toBe('1');
        expect(floatToExactString(1.5)).toBe('1.5');
        expect(floatToExactString(0.123)).toBe('0.123');

        expect(floatToExactString('1')).toBe('1');
        expect(floatToExactString('1.5')).toBe('1.5');
        expect(floatToExactString('0.123')).toBe('0.123');
    });

    it('should handle very small numbers correctly', () => {
        expect(floatToExactString(0.0000001)).toBe('0.0000001');
        expect(floatToExactString(0.000000000000000001)).toBe('0.000000000000000001');
    });

    it('should handle very large numbers correctly', () => {
        expect(floatToExactString(1234567890)).toBe('1234567890');
        expect(floatToExactString(1000000000000000000)).toBe('1000000000000000000');
    });

    it('should return 0 for NaN values', () => {
        expect(floatToExactString(NaN)).toBe('0');
        expect(floatToExactString(0 / 0)).toBe('0');
    });

    it('should handle negative numbers correctly', () => {
        expect(floatToExactString(-1.5)).toBe('-1.5');
        expect(floatToExactString(-0.0001)).toBe('-0.0001');
    });

    it('should handle numbers with leading zeros correctly', () => {
        expect(floatToExactString(1.1e-2)).toBe('0.011');
        expect(floatToExactString('1.1e-2')).toBe('0.011');
    });

    it('should handle scientific notation numbers correctly', () => {
        expect(floatToExactString(1e-10)).toBe('0.0000000001');
        expect(floatToExactString(1.23e-18)).toBe('0.00000000000000000123');
        expect(floatToExactString(1.5e12)).toBe('1500000000000');
        expect(floatToExactString(3.59029763727e-7)).toBe('0.000000359029763727');
        expect(floatToExactString('3.59029763727e-7')).toBe('0.000000359029763727');
    });

    it('should handle edge cases', () => {
        expect(floatToExactString(Number.EPSILON)).toBe('0.0000000000000002220446049250313');
        expect(floatToExactString(Number.MIN_VALUE)).toBe(
            '0.000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005',
        );
    });
});
