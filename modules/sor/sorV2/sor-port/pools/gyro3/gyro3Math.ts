// Invariant Calculation

import { MathGyro } from '../../utils/gyroHelpers/math';
import { WAD } from '../../utils/math';
import { _INVARIANT_MIN_ITERATIONS, _INVARIANT_SHRINKING_FACTOR_PER_STEP } from './constants';
import { _safeLargePow3ADown } from './helpers';

/**
 * Invariant is used to collect protocol swap fees by comparing its value between two times.
 * So we can round always to the same direction. It is also used to initiate the BPT amount
 * and, because there is a minimum BPT, we round down the invariant.
 * Argument root3Alpha = cube root of the lower price bound (symmetric across assets)
 * Note: all price bounds for the pool are alpha and 1/alpha
 */

export function _calculateInvariant(balances: bigint[], root3Alpha: bigint): bigint {
    const [a, mb, mc, md] = _calculateCubicTerms(balances, root3Alpha);
    return _calculateCubic(a, mb, mc, md, root3Alpha);
}

/**
 * @dev Prepares quadratic terms for input to _calculateCubic
 * assumes a > 0, b < 0, c <= 0, and d <= 0 and returns a, -b, -c, -d
 * terms come from cubic in Section 3.1.1
 * argument root3Alpha = cube root of alpha
 */
export function _calculateCubicTerms(balances: bigint[], root3Alpha: bigint): [bigint, bigint, bigint, bigint] {
    const alpha23 = MathGyro.mulDown(root3Alpha, root3Alpha); // alpha to the power of (2/3)
    const alpha = MathGyro.mulDown(alpha23, root3Alpha);
    const a = WAD - alpha;
    const bterm = balances[0] + balances[1] + balances[2];
    const mb = MathGyro.mulDown(MathGyro.mulDown(bterm, root3Alpha), root3Alpha);
    const cterm =
        MathGyro.mulDown(balances[0], balances[1]) +
        MathGyro.mulDown(balances[1], balances[2]) +
        MathGyro.mulDown(balances[2], balances[0]);
    const mc = MathGyro.mulDown(cterm, root3Alpha);
    const md = MathGyro.mulDown(MathGyro.mulDown(balances[0], balances[1]), balances[2]);

    return [a, mb, mc, md];
}

/**
 * @dev Calculate the maximal root of the polynomial a L^3 - mb L^2 - mc L - md.
 * This root is always non-negative, and it is the unique positive root unless mb == mc == md == 0.
 */
export function _calculateCubic(a: bigint, mb: bigint, mc: bigint, md: bigint, root3Alpha: bigint): bigint {
    let rootEst = _calculateCubicStartingPoint(a, mb, mc);
    rootEst = _runNewtonIteration(a, mb, mc, md, root3Alpha, rootEst);
    return rootEst;
}

/**
 * @dev Starting point for Newton iteration. Safe with all cubic polynomials where the coefficients have the appropriate
 * signs, but calibrated to the particular polynomial for computing the invariant.
 */
export function _calculateCubicStartingPoint(a: bigint, mb: bigint, mc: bigint): bigint {
    const radic = MathGyro.mulUp(mb, mb) + MathGyro.mulUp(MathGyro.mulUp(a, mc), WAD * 3n);
    const lmin = MathGyro.divUp(mb, a * 3n) + MathGyro.divUp(MathGyro.sqrt(radic, 5n), a * 3n);
    // This formula has been found experimentally. It is exact for alpha -> 1, where the factor is 1.5. All
    // factors > 1 are safe. For small alpha values, it is more efficient to fallback to a larger factor.
    const alpha = WAD - a; // We know that a is in [0, 1].
    const factor = alpha >= WAD / 2n ? (WAD * 3n) / 2n : WAD * 2n;
    const l0 = MathGyro.mulUp(lmin, factor);
    return l0;
}

/**
 * @dev Find a root of the given polynomial with the given starting point l.
 * Safe iff l > the local minimum.
 * Note that f(l) may be negative for the first iteration and will then be positive (up to rounding errors).
 * f'(l) is always positive for the range of values we consider.
 * See write-up, Appendix A.
 */
export function _runNewtonIteration(
    a: bigint,
    mb: bigint,
    mc: bigint,
    md: bigint,
    root3Alpha: bigint,
    rootEst: bigint,
): bigint {
    let deltaAbsPrev = 0n;
    let _rootEst = rootEst;
    for (let iteration = 0; iteration < 255; ++iteration) {
        // The delta to the next step can be positive or negative, so we represent a positive and a negative part
        // separately. The signed delta is delta_plus - delta_minus, but we only ever consider its absolute value.
        const [deltaAbs, deltaIsPos] = _calcNewtonDelta(a, mb, mc, md, root3Alpha, _rootEst);

        // ^ Note: If we ever set _INVARIANT_MIN_ITERATIONS=0, the following should include `iteration >= 1`.
        if (deltaAbs <= 1 || (iteration >= _INVARIANT_MIN_ITERATIONS && deltaIsPos))
            // This should mathematically never happen. Thus, the numerical error dominates at this point.
            return _rootEst;
        if (iteration >= _INVARIANT_MIN_ITERATIONS && deltaAbs >= deltaAbsPrev / _INVARIANT_SHRINKING_FACTOR_PER_STEP) {
            // The iteration has stalled and isn't making significant progress anymore.
            return _rootEst;
        }
        deltaAbsPrev = deltaAbs;
        if (deltaIsPos) _rootEst = _rootEst + deltaAbs;
        else _rootEst = _rootEst - deltaAbs;
    }

    throw new Error('Gyro3Pool: Newton Method did not converge on required invariant');
}

// -f(l)/f'(l), represented as an absolute value and a sign. Require that l is sufficiently large so that f is strictly increasing.
export function _calcNewtonDelta(
    _: bigint,
    mb: bigint,
    mc: bigint,
    md: bigint,
    root3Alpha: bigint,
    rootEst: bigint,
): [bigint, boolean] {
    // The following is equal to dfRootEst^3 * a but with an order of operations optimized for precision.
    // Subtraction does not underflow since rootEst is chosen so that it's always above the (only) local minimum.
    let dfRootEst = 0n;

    const rootEst2 = MathGyro.mulDown(rootEst, rootEst);
    dfRootEst = rootEst2 * 3n;
    dfRootEst =
        dfRootEst - MathGyro.mulDown(MathGyro.mulDown(MathGyro.mulDown(dfRootEst, root3Alpha), root3Alpha), root3Alpha);
    dfRootEst = dfRootEst - MathGyro.mulDown(rootEst, mb) * 2n - mc;

    const deltaMinus = _safeLargePow3ADown(rootEst, root3Alpha, dfRootEst);

    // NB: We could order the operations here in much the same way we did above to reduce errors. But tests show
    // that this has no significant effect, and it would lead to more complex code.
    let deltaPlus = MathGyro.mulDown(MathGyro.mulDown(rootEst, rootEst), mb);
    deltaPlus = MathGyro.divDown(deltaPlus + MathGyro.mulDown(rootEst, mc), dfRootEst);
    deltaPlus = deltaPlus + MathGyro.divDown(md, dfRootEst);

    const deltaIsPos = deltaPlus >= deltaMinus;
    const deltaAbs = deltaIsPos ? deltaPlus - deltaMinus : deltaMinus - deltaPlus;

    return [deltaAbs, deltaIsPos];
}

// Swap Amount Calculations

/**
 * @dev Computes how many tokens can be taken out of a pool if `amountIn` are sent, given the
 * current balances and weights.
 * Changed signs compared to original algorithm to account for amountOut < 0.
 * See Proposition 12 in 3.1.4.
 */
export function _calcOutGivenIn(
    balanceIn: bigint,
    balanceOut: bigint,
    amountIn: bigint,
    virtualOffset: bigint,
): bigint {
    // The factors in total lead to a multiplicative "safety margin" between the employed virtual offsets
    // very slightly larger than 3e-18, compensating for the maximum multiplicative error in the invariant
    // computation.

    const virtInOver = balanceIn + MathGyro.mulUp(virtualOffset, WAD + 2n);
    const virtOutUnder = balanceOut + MathGyro.mulDown(virtualOffset, WAD - 1n);
    const amountOut = (virtOutUnder * amountIn) / (virtInOver + amountIn);

    return amountOut;
}

/**
 * @dev Computes how many tokens must be sent to a pool in order to take `amountOut`, given the
 * currhent balances and weights.
 * Similar to the one before but adapting bc negative values (amountOut would be negative).
 */
export function _calcInGivenOut(
    balanceIn: bigint,
    balanceOut: bigint,
    amountOut: bigint,
    virtualOffset: bigint,
): bigint {
    // The factors in total lead to a multiplicative "safety margin" between the employed virtual offsets
    // very slightly larger than 3e-18, compensating for the maximum multiplicative error in the invariant
    // computation.
    const virtInOver = balanceIn + MathGyro.mulUp(virtualOffset, WAD + 2n);
    const virtOutUnder = balanceOut + MathGyro.mulDown(virtualOffset, WAD - 1n);

    const amountIn = MathGyro.divUp(MathGyro.mulUp(virtInOver, amountOut), virtOutUnder - amountOut);

    return amountIn;
}

/**
 * Normalized Liquidity measured with respect to the out-asset.
 * NB This is the same function as for the 2-CLP because the marginal trading curve of the 3-CLP
 * is a 2-CLP curve. We use different virtual offsets, of course.
 */
export function _getNormalizedLiquidity(balances: bigint[], virtualParamOut: bigint): bigint {
    const virtOut = balances[1] + virtualParamOut;
    return virtOut / 2n;
}
