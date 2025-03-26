import { parseUnits } from 'viem';

export class MathFx {
    static mulDownFixed(a: bigint, b: bigint, decimals = 36): bigint {
        const product = a * b;
        return product / 10n ** BigInt(decimals);
    }

    static mulUpFixed(a: bigint, b: bigint, decimals = 36): bigint {
        const product = a * b;

        if (product === 0n) {
            return 0n;
        }
        return (product - 1n) / 10n ** BigInt(decimals) + 1n;
    }

    static divDownFixed(a: bigint, b: bigint, decimals = 36): bigint {
        if (a === 0n) {
            return 0n;
        }
        const aInflated = a * 10n ** BigInt(decimals);
        return aInflated / b;
    }

    static divUpFixed(a: bigint, b: bigint, decimals = 36): bigint {
        if (a === 0n) {
            return 0n;
        }
        const aInflated = a * 10n ** BigInt(decimals);
        return (aInflated - 1n) / b + 1n;
    }
}

/**
 * Replicates the conversion operation to 64.64 fixed point numbers (ABDK library)
 * that occurs in the smart contract. This is done to replicate the loss of precision
 * that the fixed point number conversion exhibits.
 *
 * For example:
 *   - `uint256(0.0005 * 1e18).divu(1e18)` is 9223372036854775 which is 0.000499999999999999956
 *   - `uint256(0.0005 * 1e18 + 1).divu(1e18)` is 9223372036854794 which is 0.00050000000000000099
 *
 * Most but one of the parameters (`delta`) use the formula `uint256(PARAM * 1e18 + 1).divu(1e18)`
 * when converting to fixed point precision. This is the value that is used in calculations
 * in the smart contract.
 *
 * @param param any of the pool's curve parameters like alpha, beta, lambda, delta, epsilon
 * @returns bigint with the same loss of precision as the smart contract
 */
export const parseFixedCurveParam = (param: string): bigint => {
    const param64 = ((((BigInt(parseUnits(param, 18)) + 1n) << 64n) / 10n ** 18n) * 10n ** 36n) >> 64n;
    const truncatedParam64 = (param64 / 10n ** 15n + 1n) * 10n ** 15n;
    return truncatedParam64;
};
