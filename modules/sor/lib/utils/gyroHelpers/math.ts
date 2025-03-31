import { WAD } from '../math';

// SQRT constants
export const SQRT_1E_NEG_1 = 316227766016837933n;
export const SQRT_1E_NEG_3 = 31622776601683793n;
export const SQRT_1E_NEG_5 = 3162277660168379n;
export const SQRT_1E_NEG_7 = 316227766016837n;
export const SQRT_1E_NEG_9 = 31622776601683n;
export const SQRT_1E_NEG_11 = 3162277660168n;
export const SQRT_1E_NEG_13 = 316227766016n;
export const SQRT_1E_NEG_15 = 31622776601n;
export const SQRT_1E_NEG_17 = 3162277660n;

// High precision
export const ONE_XP = 10n ** 38n; // 38 decimal places

// Small number to prevent rounding errors
export const SMALL = 10n ** 8n; // 1e-10 in normal precision

// Swap Limit factor
export const SWAP_LIMIT_FACTOR = 999999000000000000n;

/////////
/// ARITHMETIC HELPERS
/////////
export class MathGyro {
    static mulUp(a: bigint, b: bigint): bigint {
        const product = a * b;
        return (product - 1n) / WAD + 1n;
    }

    static divUp(a: bigint, b: bigint): bigint {
        const aInflated = a * WAD;
        return (aInflated - 1n) / b + 1n;
    }

    static mulDown(a: bigint, b: bigint): bigint {
        const product = a * b;
        return product / WAD;
    }

    static divDown(a: bigint, b: bigint): bigint {
        const aInflated = a * WAD;
        return aInflated / b;
    }

    static mulXpU(a: bigint, b: bigint): bigint {
        return (a * b) / ONE_XP;
    }

    static divXpU(a: bigint, b: bigint): bigint {
        if (b === 0n) throw new Error('ZERO DIVISION');
        return (a * ONE_XP) / b;
    }

    static mulDownMagU(a: bigint, b: bigint): bigint {
        return (a * b) / WAD;
    }

    static divDownMagU(a: bigint, b: bigint): bigint {
        if (b === 0n) throw new Error('ZERO DIVISION');
        return (a * WAD) / b;
    }

    static mulUpMagU(a: bigint, b: bigint): bigint {
        const product = a * b;
        if (product > 0n) return (product - 1n) / WAD + 1n;
        if (product < 0n) return (product + 1n) / WAD - 1n;
        return 0n;
    }

    static divUpMagU(a: bigint, b: bigint): bigint {
        if (b === 0n) throw new Error('ZERO DIVISION');
        if (a === 0n) return 0n;
        let _b = b;
        let _a = a;
        if (b < 0n) {
            _b = b * -1n;
            _a = a * -1n;
        }
        return _a > 0n ? (_a * WAD - 1n) / _b + 1n : (_a * WAD + 1n) / (_b - 1n);
    }

    static mulUpXpToNpU(a: bigint, b: bigint): bigint {
        const TenPower19 = 10n ** 19n;
        const b1 = b / TenPower19;
        const b2 = b < 0n ? ((b * -1n) % TenPower19) * -1n : b % TenPower19;
        const prod1 = a * b1;
        const prod2 = a * b2;
        return prod1 <= 0n && prod2 <= 0n
            ? (prod1 + prod2 / TenPower19) / TenPower19
            : (prod1 + prod2 / TenPower19 - 1n) / TenPower19 + 1n;
    }

    static mulDownXpToNpU(a: bigint, b: bigint): bigint {
        const TenPower19 = 10n ** 19n;
        const b1 = b / TenPower19;
        const b2 = b < 0n ? ((b * -1n) % TenPower19) * -1n : b % TenPower19;
        const prod1 = a * b1;
        const prod2 = a * b2;
        return prod1 >= 0n && prod2 >= 0n
            ? (prod1 + prod2 / TenPower19) / TenPower19
            : (prod1 + prod2 / TenPower19 + 1n) / TenPower19 - 1n;
    }

    /////////
    /// SQUARE ROOT
    /////////

    static sqrt(input: bigint, tolerance: bigint): bigint {
        if (input === 0n) {
            return 0n;
        }
        let guess = MathGyro.makeInitialGuess(input);

        // 7 iterations
        for (let i = 0; i < 7; i++) {
            guess = (guess + (input * WAD) / guess) / 2n;
        }

        // Check square is more or less correct (in some epsilon range)
        const guessSquared = (guess * guess) / WAD;
        if (
            !(
                guessSquared <= input + MathGyro.mulUp(guess, tolerance) &&
                guessSquared >= input - MathGyro.mulUp(guess, tolerance)
            )
        )
            throw new Error('GyroEPool: sqrt failed');

        return guess;
    }

    static makeInitialGuess(input: bigint) {
        if (input > WAD) {
            return 2n ** MathGyro.intLog2Halved(input / WAD) * WAD;
        }
        if (input <= 10n) {
            return SQRT_1E_NEG_17;
        }
        if (input <= 100n) {
            return 10000000000n;
        }
        if (input <= 1000n) {
            return SQRT_1E_NEG_15;
        }
        if (input <= 10000n) {
            return 100000000000n;
        }
        if (input <= 100000n) {
            return SQRT_1E_NEG_13;
        }
        if (input <= 1000000n) {
            return 1000000000000n;
        }
        if (input <= 10000000n) {
            return SQRT_1E_NEG_11;
        }
        if (input <= 100000000n) {
            return 10000000000000n;
        }
        if (input <= 1000000000n) {
            return SQRT_1E_NEG_9;
        }
        if (input <= 10000000000n) {
            return 100000000000000n;
        }
        if (input <= 100000000000n) {
            return SQRT_1E_NEG_7;
        }
        if (input <= 1000000000000n) {
            return 1000000000000000n;
        }
        if (input <= 10000000000000n) {
            return SQRT_1E_NEG_5;
        }
        if (input <= 100000000000000n) {
            return 10000000000000000n;
        }
        if (input <= 1000000000000000n) {
            return SQRT_1E_NEG_3;
        }
        if (input <= 10000000000000000n) {
            return 100000000000000000n;
        }
        if (input <= 100000000000000000n) {
            return SQRT_1E_NEG_1;
        }
        return input;
    }

    static intLog2Halved(x: bigint) {
        let n = 0n;
        let _x = x;

        for (let i = 128n; i >= 2n; i = i / 2n) {
            const factor = 2n ** i;
            if (_x >= factor) {
                _x = _x / factor;
                n += i / 2n;
            }
        }

        return n;
    }
}
