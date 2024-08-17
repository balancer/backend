import { WAD } from '../../utils/math';
import { _SAFE_LARGE_POW3_THRESHOLD, MIDDECIMAL } from './constants';

// Helpers
export function _safeLargePow3ADown(l: bigint, root3Alpha: bigint, d: bigint): bigint {
    let ret = 0n;
    if (l <= _SAFE_LARGE_POW3_THRESHOLD) {
        // Simple case where there is no overflow
        ret = (((l * l) / WAD) * l) / WAD;
        ret = ret - (((((ret * root3Alpha) / WAD) * root3Alpha) / WAD) * root3Alpha) / WAD;
        ret = (ret * WAD) / d;
    } else {
        ret = (l * l) / WAD;

        // Compute l^2 * l * (1 - root3Alpha^3)
        // The following products split up the factors into different groups of decimal places to reduce temorary
        // blowup and prevent overflow.
        // No precision is lost.
        ret = ret * (l / WAD) + ((ret * l) % WAD) / WAD;

        let x = ret;

        for (let i = 0; i < 3; i++) {
            x = (x * (root3Alpha / MIDDECIMAL)) / MIDDECIMAL + ((x * root3Alpha) % MIDDECIMAL);
        }
        ret = ret - x;

        // We perform half-precision division to reduce blowup.
        // In contrast to the above multiplications, this loses precision if d is small. However, tests show that,
        // for the l and d values considered here, the precision lost would be below the precision of the fixed
        // point type itself, so nothing is actually lost.
        ret = (ret * MIDDECIMAL) / (d / MIDDECIMAL);
    }
    return ret;
}
