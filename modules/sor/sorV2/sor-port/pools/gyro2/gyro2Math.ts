import { MathGyro } from '../../utils/gyroHelpers/math';
import { FOUR_WAD, MathSol, TWO_WAD, WAD } from '../../utils/math';

export function _calcOutGivenIn(
    balanceIn: bigint,
    balanceOut: bigint,
    amountIn: bigint,
    virtualParamIn: bigint,
    virtualParamOut: bigint,
): bigint {
    // The factors in total lead to a multiplicative "safety margin" between the employed virtual offsets
    // very slightly larger than 3e-18.
    const virtInOver = balanceIn + MathSol.mulUpFixed(virtualParamIn, WAD + 2n);
    const virtOutUnder = balanceOut + MathSol.mulDownFixed(virtualParamOut, WAD - 1n);

    const amountOut = MathSol.divDownFixed(MathSol.mulDownFixed(virtOutUnder, amountIn), virtInOver + amountIn);

    return amountOut;
}

export function _calcInGivenOut(
    balanceIn: bigint,
    balanceOut: bigint,
    amountOut: bigint,
    virtualParamIn: bigint,
    virtualParamOut: bigint,
): bigint {
    // The factors in total lead to a multiplicative "safety margin" between the employed virtual offsets
    // very slightly larger than 3e-18.
    const virtInOver = balanceIn + MathSol.mulUpFixed(virtualParamIn, WAD + 2n);
    const virtOutUnder = balanceOut + MathSol.mulDownFixed(virtualParamOut, WAD - 1n);

    const amountIn = MathSol.divUpFixed(MathSol.mulUpFixed(virtInOver, amountOut), virtOutUnder - amountOut);

    return amountIn;
}

export function _findVirtualParams(invariant: bigint, sqrtAlpha: bigint, sqrtBeta: bigint): [bigint, bigint] {
    return [MathSol.divDownFixed(invariant, sqrtBeta), MathSol.mulDownFixed(invariant, sqrtAlpha)];
}

export function _calculateInvariant(
    balances: bigint[], // balances
    sqrtAlpha: bigint,
    sqrtBeta: bigint,
): bigint {
    const [a, mb, bSquare, mc] = _calculateQuadraticTerms(balances, sqrtAlpha, sqrtBeta);

    const invariant = _calculateQuadratic(a, mb, bSquare, mc);

    return invariant;
}

export function _calculateQuadraticTerms(
    balances: bigint[],
    sqrtAlpha: bigint,
    sqrtBeta: bigint,
): [bigint, bigint, bigint, bigint] {
    const a = WAD - MathSol.divDownFixed(sqrtAlpha, sqrtBeta);
    const bterm0 = MathSol.divDownFixed(balances[1], sqrtBeta);
    const bterm1 = MathSol.mulDownFixed(balances[0], sqrtAlpha);
    const mb = bterm0 + bterm1;
    const mc = MathSol.mulDownFixed(balances[0], balances[1]);

    // For better fixed point precision, calculate in expanded form w/ re-ordering of multiplications
    // b^2 = x^2 * alpha + x*y*2*sqrt(alpha/beta) + y^2 / beta
    let bSquare = MathSol.mulDownFixed(
        MathSol.mulDownFixed(MathSol.mulDownFixed(balances[0], balances[0]), sqrtAlpha),
        sqrtAlpha,
    );
    const bSq2 = MathSol.divDownFixed(
        MathSol.mulDownFixed(MathSol.mulDownFixed(MathSol.mulDownFixed(balances[0], balances[1]), TWO_WAD), sqrtAlpha),
        sqrtBeta,
    );

    const bSq3 = MathSol.divDownFixed(
        MathSol.mulDownFixed(balances[1], balances[1]),
        MathSol.mulUpFixed(sqrtBeta, sqrtBeta),
    );

    bSquare = bSquare + bSq2 + bSq3;

    return [a, mb, bSquare, mc];
}

export function _calculateQuadratic(a: bigint, mb: bigint, bSquare: bigint, mc: bigint): bigint {
    const denominator = MathSol.mulUpFixed(a, TWO_WAD);
    // order multiplications for fixed point precision
    const addTerm = MathSol.mulDownFixed(MathSol.mulDownFixed(mc, FOUR_WAD), a);
    // The minus sign in the radicand cancels out in this special case, so we add
    const radicand = bSquare + addTerm;
    const sqrResult = MathGyro.sqrt(radicand, 5n);
    // The minus sign in the numerator cancels out in this special case
    const numerator = mb + sqrResult;
    const invariant = MathSol.divDownFixed(numerator, denominator);

    return invariant;
}
