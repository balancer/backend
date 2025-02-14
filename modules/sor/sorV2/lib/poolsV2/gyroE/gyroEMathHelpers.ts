import { MathGyro, ONE_XP } from '../../utils/gyroHelpers/math';
import { MAX_BALANCES } from './constants';
import { DerivedGyroEParams, GyroEParams, Vector2 } from './types';

/////////
/// TYPES
/////////

// terms in this struct are stored in extra precision (38 decimals) with final dcimal rounded down

export type QParams = {
    a: bigint;
    b: bigint;
    c: bigint;
};

////////
/// BALANCE CALCULATION
////////

export function balancesFromTokenInOut(
    balanceTokenIn: bigint,
    balanceTokenOut: bigint,
    tokenInIsToken0: boolean,
): [bigint, bigint] {
    return tokenInIsToken0 ? [balanceTokenIn, balanceTokenOut] : [balanceTokenOut, balanceTokenIn];
}

/////////
/// INVARIANT CALC
/////////

export function calcAtAChi(x: bigint, y: bigint, p: GyroEParams, d: DerivedGyroEParams): bigint {
    const dSq2 = MathGyro.mulXpU(d.dSq, d.dSq);

    // (cx - sy) * (w/lambda + z) / lambda
    //      account for 2 factors of dSq (4 s,c factors)
    const termXp = MathGyro.divXpU(MathGyro.divDownMagU(MathGyro.divDownMagU(d.w, p.lambda) + d.z, p.lambda), dSq2);

    let val = MathGyro.mulDownXpToNpU(MathGyro.mulDownMagU(x, p.c) - MathGyro.mulDownMagU(y, p.s), termXp);

    // (x lambda s + y lambda c) * u, note u > 0
    let termNp =
        MathGyro.mulDownMagU(MathGyro.mulDownMagU(x, p.lambda), p.s) +
        MathGyro.mulDownMagU(MathGyro.mulDownMagU(y, p.lambda), p.c);
    val = val + MathGyro.mulDownXpToNpU(termNp, MathGyro.divXpU(d.u, dSq2));

    // (sx+cy) * v, note v > 0
    termNp = MathGyro.mulDownMagU(x, p.s) + MathGyro.mulDownMagU(y, p.c);
    val = val + MathGyro.mulDownXpToNpU(termNp, MathGyro.divXpU(d.v, dSq2));

    return val;
}

export function calcInvariantSqrt(x: bigint, y: bigint, p: GyroEParams, d: DerivedGyroEParams): [bigint, bigint] {
    let val = calcMinAtxAChiySqPlusAtxSq(x, y, p, d) + calc2AtxAtyAChixAChiy(x, y, p, d);
    val = val + calcMinAtyAChixSqPlusAtySq(x, y, p, d);
    const err = (MathGyro.mulUpMagU(x, x) + MathGyro.mulUpMagU(y, y)) / ONE_XP;
    val = val > 0 ? MathGyro.sqrt(val, 5n) : 0n;
    return [val, err];
}

function calcMinAtxAChiySqPlusAtxSq(x: bigint, y: bigint, p: GyroEParams, d: DerivedGyroEParams) {
    let termNp =
        MathGyro.mulUpMagU(MathGyro.mulUpMagU(MathGyro.mulUpMagU(x, x), p.c), p.c) +
        MathGyro.mulUpMagU(MathGyro.mulUpMagU(MathGyro.mulUpMagU(y, y), p.s), p.s);
    termNp = termNp - MathGyro.mulDownMagU(MathGyro.mulDownMagU(MathGyro.mulDownMagU(x, y), p.c * 2n), p.s);
    const termXp =
        MathGyro.mulXpU(d.u, d.u) +
        MathGyro.divDownMagU(MathGyro.mulXpU(d.u * 2n, d.v), p.lambda) +
        MathGyro.divDownMagU(MathGyro.divDownMagU(MathGyro.mulXpU(d.v, d.v), p.lambda), p.lambda);

    let val = MathGyro.mulDownXpToNpU(termNp * -1n, termXp);
    val =
        val +
        MathGyro.mulDownXpToNpU(
            MathGyro.divDownMagU(MathGyro.divDownMagU(termNp - 9n, p.lambda), p.lambda),
            MathGyro.divXpU(ONE_XP, d.dSq),
        );
    return val;
}

function calc2AtxAtyAChixAChiy(x: bigint, y: bigint, p: GyroEParams, d: DerivedGyroEParams) {
    let termNp = MathGyro.mulDownMagU(
        MathGyro.mulDownMagU(MathGyro.mulDownMagU(x, x) - MathGyro.mulUpMagU(y, y), p.c * 2n),
        p.s,
    );

    const xy = MathGyro.mulDownMagU(y, x * 2n);
    termNp =
        termNp +
        MathGyro.mulDownMagU(MathGyro.mulDownMagU(xy, p.c), p.c) -
        MathGyro.mulDownMagU(MathGyro.mulDownMagU(xy, p.s), p.s);
    let termXp =
        MathGyro.mulXpU(d.z, d.u) +
        MathGyro.divDownMagU(MathGyro.divDownMagU(MathGyro.mulXpU(d.w, d.v), p.lambda), p.lambda);
    termXp = termXp + MathGyro.divDownMagU(MathGyro.mulXpU(d.w, d.u) + MathGyro.mulXpU(d.z, d.v), p.lambda);
    termXp = MathGyro.divXpU(termXp, MathGyro.mulXpU(MathGyro.mulXpU(MathGyro.mulXpU(d.dSq, d.dSq), d.dSq), d.dSq));
    const val = MathGyro.mulDownXpToNpU(termNp, termXp);
    return val;
}

function calcMinAtyAChixSqPlusAtySq(x: bigint, y: bigint, p: GyroEParams, d: DerivedGyroEParams) {
    let termNp =
        MathGyro.mulUpMagU(MathGyro.mulUpMagU(MathGyro.mulUpMagU(x, x), p.s), p.s) +
        MathGyro.mulUpMagU(MathGyro.mulUpMagU(MathGyro.mulUpMagU(y, y), p.c), p.c);
    termNp = termNp + MathGyro.mulUpMagU(MathGyro.mulUpMagU(MathGyro.mulUpMagU(x, y), p.s * 2n), p.c);
    let termXp =
        MathGyro.mulXpU(d.z, d.z) +
        MathGyro.divDownMagU(MathGyro.divDownMagU(MathGyro.mulXpU(d.w, d.w), p.lambda), p.lambda);
    termXp = termXp + MathGyro.divDownMagU(MathGyro.mulXpU(d.z * 2n, d.w), p.lambda);
    termXp = MathGyro.divXpU(termXp, MathGyro.mulXpU(MathGyro.mulXpU(MathGyro.mulXpU(d.dSq, d.dSq), d.dSq), d.dSq));
    let val = MathGyro.mulDownXpToNpU(termNp * -1n, termXp);
    val = val + MathGyro.mulDownXpToNpU(termNp - 9n, MathGyro.divXpU(ONE_XP, d.dSq));
    return val;
}

export function calcAChiAChiInXp(p: GyroEParams, d: DerivedGyroEParams): bigint {
    const dSq3 = MathGyro.mulXpU(MathGyro.mulXpU(d.dSq, d.dSq), d.dSq);
    let val = MathGyro.mulUpMagU(p.lambda, MathGyro.divXpU(MathGyro.mulXpU(d.u * 2n, d.v), dSq3));
    val =
        val +
        MathGyro.mulUpMagU(
            MathGyro.mulUpMagU(MathGyro.divXpU(MathGyro.mulXpU(d.u + 1n, d.u + 1n), dSq3), p.lambda),
            p.lambda,
        );
    val = val + MathGyro.divXpU(MathGyro.mulXpU(d.v, d.v), dSq3);
    const termXp = MathGyro.divUpMagU(d.w, p.lambda) + d.z;
    val = val + MathGyro.divXpU(MathGyro.mulXpU(termXp, termXp), dSq3);
    return val;
}

/////////
/// SWAP AMOUNT CALC
/////////

export function checkAssetBounds(
    params: GyroEParams,
    derived: DerivedGyroEParams,
    invariant: Vector2,
    newBal: bigint,
    assetIndex: number,
): void {
    if (assetIndex === 0) {
        const xPlus = maxBalances0(params, derived, invariant);
        if (newBal > MAX_BALANCES || newBal > xPlus) throw new Error('ASSET BOUNDS EXCEEDED');
    } else {
        const yPlus = maxBalances1(params, derived, invariant);
        if (newBal > MAX_BALANCES || newBal > yPlus) throw new Error('ASSET BOUNDS EXCEEDED');
    }
}

function maxBalances0(p: GyroEParams, d: DerivedGyroEParams, r: Vector2) {
    const termXp1 = MathGyro.divXpU(d.tauBeta.x - d.tauAlpha.x, d.dSq);
    const termXp2 = MathGyro.divXpU(d.tauBeta.y - d.tauAlpha.y, d.dSq);
    let xp = MathGyro.mulDownXpToNpU(
        MathGyro.mulDownMagU(MathGyro.mulDownMagU(r.y, p.lambda), p.c),
        termXp1
    );
    xp = xp + (
        termXp2 > 0n
            ? MathGyro.mulDownXpToNpU(MathGyro.mulDownMagU(r.y, p.s), termXp2)
            : MathGyro.mulDownXpToNpU(MathGyro.mulUpMagU(r.x, p.s), termXp2)
    );
    return xp;
}

function maxBalances1(p: GyroEParams, d: DerivedGyroEParams, r: Vector2) {
    const termXp1 = MathGyro.divXpU(d.tauBeta.x - d.tauAlpha.x, d.dSq);
    const termXp2 = MathGyro.divXpU(d.tauBeta.y - d.tauAlpha.y, d.dSq);
    let yp = MathGyro.mulDownXpToNpU(
        MathGyro.mulDownMagU(MathGyro.mulDownMagU(r.y, p.lambda), p.s),
        termXp1
    );
    yp = yp + (
        termXp2 > 0n
            ? MathGyro.mulDownXpToNpU(MathGyro.mulDownMagU(r.y, p.c), termXp2)
            : MathGyro.mulDownXpToNpU(MathGyro.mulUpMagU(r.x, p.c), termXp2)
    );
    return yp;
}

export function calcYGivenX(x: bigint, params: GyroEParams, d: DerivedGyroEParams, r: Vector2): bigint {
    const ab: Vector2 = {
        x: virtualOffset0(params, d, r),
        y: virtualOffset1(params, d, r),
    };

    const y = solveQuadraticSwap(params.lambda, x, params.s, params.c, r, ab, d.tauBeta, d.dSq);
    return y;
}

export function calcXGivenY(y: bigint, params: GyroEParams, d: DerivedGyroEParams, r: Vector2): bigint {
    const ba: Vector2 = {
        x: virtualOffset1(params, d, r),
        y: virtualOffset0(params, d, r),
    };
    const x = solveQuadraticSwap(
        params.lambda,
        y,
        params.c,
        params.s,
        r,
        ba,
        {
            x: d.tauAlpha.x * -1n,
            y: d.tauAlpha.y,
        },
        d.dSq,
    );
    return x;
}

export function virtualOffset0(p: GyroEParams, d: DerivedGyroEParams, r: Vector2, switchTau?: boolean): bigint {
    const tauValue = switchTau ? d.tauAlpha : d.tauBeta;
    const termXp = MathGyro.divXpU(tauValue.x, d.dSq);

    let a =
        tauValue.x > 0n
            ? MathGyro.mulUpXpToNpU(MathGyro.mulUpMagU(MathGyro.mulUpMagU(r.x, p.lambda), p.c), termXp)
            : MathGyro.mulUpXpToNpU(MathGyro.mulDownMagU(MathGyro.mulDownMagU(r.y, p.lambda), p.c), termXp);

    a = a + MathGyro.mulUpXpToNpU(MathGyro.mulUpMagU(r.x, p.s), MathGyro.divXpU(tauValue.y, d.dSq));

    return a;
}

export function virtualOffset1(p: GyroEParams, d: DerivedGyroEParams, r: Vector2, switchTau?: boolean): bigint {
    const tauValue = switchTau ? d.tauBeta : d.tauAlpha;
    const termXp = MathGyro.divXpU(tauValue.x, d.dSq);

    let b =
        tauValue.x < 0n
            ? MathGyro.mulUpXpToNpU(MathGyro.mulUpMagU(MathGyro.mulUpMagU(r.x, p.lambda), p.s), termXp * -1n)
            : MathGyro.mulUpXpToNpU(MathGyro.mulDownMagU(MathGyro.mulDownMagU(r.y * -1n, p.lambda), p.s), termXp);

    b = b + MathGyro.mulUpXpToNpU(MathGyro.mulUpMagU(r.x, p.c), MathGyro.divXpU(tauValue.y, d.dSq));
    return b;
}

function solveQuadraticSwap(
    lambda: bigint,
    x: bigint,
    s: bigint,
    c: bigint,
    r: Vector2,
    ab: Vector2,
    tauBeta: Vector2,
    dSq: bigint,
): bigint {
    const lamBar: Vector2 = {
        x: ONE_XP - MathGyro.divDownMagU(MathGyro.divDownMagU(ONE_XP, lambda), lambda),
        y: ONE_XP - MathGyro.divUpMagU(MathGyro.divUpMagU(ONE_XP, lambda), lambda),
    };
    const q: QParams = {
        a: 0n,
        b: 0n,
        c: 0n,
    };
    const xp = x - ab.x;
    if (xp > 0n) {
        q.b = MathGyro.mulUpXpToNpU(
            MathGyro.mulDownMagU(MathGyro.mulDownMagU(xp * -1n, s), c),
            MathGyro.divXpU(lamBar.y, dSq),
        );
    } else {
        q.b = MathGyro.mulUpXpToNpU(
            MathGyro.mulUpMagU(MathGyro.mulUpMagU(xp * -1n, s), c),
            MathGyro.divXpU(lamBar.x, dSq) + 1n,
        );
    }
    const sTerm: Vector2 = {
        x: MathGyro.divXpU(MathGyro.mulDownMagU(MathGyro.mulDownMagU(lamBar.y, s), s), dSq),
        y: MathGyro.divXpU(MathGyro.mulUpMagU(MathGyro.mulUpMagU(lamBar.x, s), s), dSq + 1n) + 1n,
    };
    sTerm.x = ONE_XP - sTerm.x;
    sTerm.y = ONE_XP - sTerm.y;

    q.c = calcXpXpDivLambdaLambda(x, r, lambda, s, c, tauBeta, dSq) * -1n;
    q.c = q.c + MathGyro.mulDownXpToNpU(MathGyro.mulDownMagU(r.y, r.y), sTerm.y); // r.y ===  currentInv + err
    q.c = q.c > 0n ? MathGyro.sqrt(q.c, 5n) : 0n;
    if (q.b - q.c > 0n) {
        q.a = MathGyro.mulUpXpToNpU(q.b - q.c, MathGyro.divXpU(ONE_XP, sTerm.y) + 1n);
    } else {
        q.a = MathGyro.mulUpXpToNpU(q.b - q.c, MathGyro.divXpU(ONE_XP, sTerm.x));
    }
    return q.a + ab.y;
}

export function calcXpXpDivLambdaLambda(
    x: bigint,
    r: Vector2,
    lambda: bigint,
    s: bigint,
    c: bigint,
    tauBeta: Vector2,
    dSq: bigint,
): bigint {
    const sqVars = {
        x: MathGyro.mulXpU(dSq, dSq),
        y: MathGyro.mulUpMagU(r.x, r.x),
    };
    const q: QParams = {
        a: 0n,
        b: 0n,
        c: 0n,
    };
    let termXp = MathGyro.divXpU(MathGyro.mulXpU(tauBeta.x, tauBeta.y), sqVars.x);
    if (termXp > 0n) {
        q.a = MathGyro.mulUpMagU(sqVars.y, s * 2n);
        q.a = MathGyro.mulUpXpToNpU(MathGyro.mulUpMagU(q.a, c), termXp + 7n);
    } else {
        q.a = MathGyro.mulDownMagU(MathGyro.mulDownMagU(r.y, r.y), s * 2n); // r.y ===  currentInv + err
        q.a = MathGyro.mulUpXpToNpU(MathGyro.mulDownMagU(q.a, c), termXp);
    }

    if (tauBeta.x < 0n) {
        q.b = MathGyro.mulUpXpToNpU(
            MathGyro.mulUpMagU(MathGyro.mulUpMagU(r.x, x), c * 2n),
            MathGyro.divXpU(tauBeta.x, dSq) * -1n + 3n,
        );
    } else {
        q.b = MathGyro.mulUpXpToNpU(
            MathGyro.mulDownMagU(MathGyro.mulDownMagU(r.y * -1n, x), c * 2n),
            MathGyro.divXpU(tauBeta.x, dSq),
        );
    }
    q.a = q.a + q.b;
    termXp = MathGyro.divXpU(MathGyro.mulXpU(tauBeta.y, tauBeta.y), sqVars.x) + 7n;
    q.b = MathGyro.mulUpMagU(sqVars.y, s);
    q.b = MathGyro.mulUpXpToNpU(MathGyro.mulUpMagU(q.b, s), termXp);

    q.c = MathGyro.mulUpXpToNpU(
        MathGyro.mulDownMagU(MathGyro.mulDownMagU(r.y * -1n, x), s * 2n),
        MathGyro.divXpU(tauBeta.y, dSq),
    );
    q.b = q.b + q.c + MathGyro.mulUpMagU(x, x);
    q.b = q.b > 0n ? MathGyro.divUpMagU(q.b, lambda) : MathGyro.divDownMagU(q.b, lambda);

    q.a = q.a + q.b;
    q.a = q.a > 0n ? MathGyro.divUpMagU(q.a, lambda) : MathGyro.divDownMagU(q.a, lambda);

    termXp = MathGyro.divXpU(MathGyro.mulXpU(tauBeta.x, tauBeta.x), sqVars.x) + 7n;
    const val = MathGyro.mulUpMagU(MathGyro.mulUpMagU(sqVars.y, c), c);
    return MathGyro.mulUpXpToNpU(val, termXp) + q.a;
}
