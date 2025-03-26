import { MAX_BALANCES, MAX_INVARIANT } from './constants';
import {
    calcAtAChi,
    calcInvariantSqrt,
    calcAChiAChiInXp,
    calcXGivenY,
    calcYGivenX,
    checkAssetBounds,
} from './gyroEMathHelpers';
import { normalizedLiquidityXIn, normalizedLiquidityYIn } from './gyroEMathFunctions';
import { DerivedGyroEParams, GyroEParams, Vector2 } from './types';
import { MathGyro, ONE_XP, SMALL } from '../../utils/gyroHelpers/math';

export function calculateNormalizedLiquidity(
    balances: bigint[],
    params: GyroEParams,
    derived: DerivedGyroEParams,
    r: Vector2,
    fee: bigint,
    tokenInIsToken0: boolean,
): bigint {
    if (tokenInIsToken0) {
        return normalizedLiquidityXIn(balances, params, derived, fee, r);
    }
    return normalizedLiquidityYIn(balances, params, derived, fee, r);
}

export function calculateInvariantWithError(
    balances: bigint[],
    params: GyroEParams,
    derived: DerivedGyroEParams,
): [bigint, bigint] {
    const [x, y] = balances;

    if (x + y > MAX_BALANCES) throw new Error('MAX ASSETS EXCEEDED');
    const AtAChi = calcAtAChi(x, y, params, derived);

    const invariantResult = calcInvariantSqrt(x, y, params, derived);
    const square_root = invariantResult[0];
    let err = invariantResult[1];

    if (square_root > 0) {
        err = MathGyro.divUpMagU(err + 1n, square_root * 2n);
    } else {
        err = err > 0 ? MathGyro.sqrt(err, 5n) : 10n ** 9n;
    }

    err = (MathGyro.mulUpMagU(params.lambda, x + y) / ONE_XP + err + 1n) * 20n;

    const mulDenominator = MathGyro.divXpU(ONE_XP, calcAChiAChiInXp(params, derived) - ONE_XP);
    const invariant = MathGyro.mulDownXpToNpU(AtAChi + square_root - err, mulDenominator);
    err = MathGyro.mulUpXpToNpU(err, mulDenominator);

    err =
        err +
        (MathGyro.mulUpXpToNpU(invariant, mulDenominator) * ((params.lambda * params.lambda) / 10n ** 36n) * 40n) /
            ONE_XP +
        1n;

    if (invariant + err > MAX_INVARIANT) throw new Error('MAX INVARIANT EXCEEDED');

    return [invariant, err];
}

export function calcOutGivenIn(
    balances: bigint[],
    amountIn: bigint,
    tokenInIsToken0: boolean,
    params: GyroEParams,
    derived: DerivedGyroEParams,
    invariant: Vector2,
): bigint {
    if (amountIn < SMALL) return 0n;

    const ixIn = Number(!tokenInIsToken0);
    const ixOut = Number(tokenInIsToken0);

    const calcGiven = tokenInIsToken0 ? calcYGivenX : calcXGivenY;

    const balInNew = balances[ixIn] + amountIn;

    checkAssetBounds(params, derived, invariant, balInNew, ixIn);
    const balOutNew = calcGiven(balInNew, params, derived, invariant);
    const amountOut = balances[ixOut] - balOutNew;
    if (amountOut < 0) {
        // Should never happen; check anyways to catch a numerical bug.
        throw new Error('ASSET BOUNDS EXCEEDED 1');
    }

    return amountOut;
}

export function calcInGivenOut(
    balances: bigint[],
    amountOut: bigint,
    tokenInIsToken0: boolean,
    params: GyroEParams,
    derived: DerivedGyroEParams,
    invariant: Vector2,
): bigint {
    if (amountOut < SMALL) return 0n;

    const ixIn = Number(!tokenInIsToken0);
    const ixOut = Number(tokenInIsToken0);

    const calcGiven = tokenInIsToken0 ? calcXGivenY : calcYGivenX;

    if (amountOut > balances[ixOut]) throw new Error('ASSET BOUNDS EXCEEDED 2');
    const balOutNew = balances[ixOut] - amountOut;

    const balInNew = calcGiven(balOutNew, params, derived, invariant);
    checkAssetBounds(params, derived, invariant, balInNew, ixIn);
    const amountIn = balInNew - balances[ixIn];

    if (amountIn < 0)
        // Should never happen; check anyways to catch a numerical bug.
        throw new Error('ASSET BOUNDS EXCEEDED 3');
    return amountIn;
}
