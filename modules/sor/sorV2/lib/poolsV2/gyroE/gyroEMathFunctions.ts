import { MathGyro } from '../../utils/gyroHelpers/math';
import { WAD } from '../../utils/math';
import { virtualOffset0, virtualOffset1 } from './gyroEMathHelpers';
import { DerivedGyroEParams, GyroEParams, Vector2 } from './types';

/////////
/// SPOT PRICE DERIVATIVE CALCULATIONS
/////////

function setup(
    balances: bigint[],
    params: GyroEParams,
    derived: DerivedGyroEParams,
    fee: bigint,
    rVec: Vector2,
    ixVar: number,
) {
    const r = rVec.y;
    const { c, s, lambda } = params;
    const [x0, y0] = balances;
    const a = virtualOffset0(params, derived, rVec);
    const b = virtualOffset1(params, derived, rVec);
    const ls = WAD - MathGyro.divDown(WAD, MathGyro.mulDown(lambda, lambda));
    const f = WAD - fee;

    let R: bigint;
    if (ixVar === 0) {
        R = MathGyro.sqrt(
            MathGyro.mulDown(MathGyro.mulDown(r, r), WAD - MathGyro.mulDown(ls, MathGyro.mulDown(s, s))) -
                MathGyro.divDown(MathGyro.mulDown(x0 - a, x0 - a), MathGyro.mulDown(lambda, lambda)),
            5n,
        );
    } else {
        R = MathGyro.sqrt(
            MathGyro.mulDown(MathGyro.mulDown(r, r), WAD - MathGyro.mulDown(ls, MathGyro.mulDown(c, c))) -
                MathGyro.divDown(MathGyro.mulDown(y0 - b, y0 - b), MathGyro.mulDown(lambda, lambda)),
            5n,
        );
    }

    return { x0, y0, c, s, lambda, a, b, ls, f, r, R };
}

export function normalizedLiquidityYIn(
    balances: bigint[],
    params: GyroEParams,
    derived: DerivedGyroEParams,
    fee: bigint,
    rVec: Vector2,
): bigint {
    const { y0, c, s, lambda, b, ls, R } = setup(balances, params, derived, fee, rVec, 1);

    const returnValue = MathGyro.divDown(
        MathGyro.mulDown(
            MathGyro.divDown(WAD, WAD - MathGyro.mulDown(ls, MathGyro.mulDown(c, c))),
            MathGyro.mulDown(
                R,
                MathGyro.mulDown(
                    MathGyro.mulDown(
                        MathGyro.mulDown(
                            MathGyro.mulDown(MathGyro.mulDown(ls, s), c),
                            MathGyro.mulDown(lambda, lambda),
                        ),
                        R,
                    ) -
                        (y0 - b),
                    MathGyro.mulDown(
                        MathGyro.mulDown(
                            MathGyro.mulDown(MathGyro.mulDown(ls, s), c),
                            MathGyro.mulDown(lambda, lambda),
                        ),
                        R,
                    ) -
                        (y0 - b),
                ),
            ),
        ),
        MathGyro.mulDown(MathGyro.mulDown(lambda, lambda), MathGyro.mulDown(R, R)) + MathGyro.mulDown(y0 - b, y0 - b),
    );

    return returnValue;
}

export function normalizedLiquidityXIn(
    balances: bigint[],
    params: GyroEParams,
    derived: DerivedGyroEParams,
    fee: bigint,
    rVec: Vector2,
): bigint {
    const { x0, c, s, lambda, a, ls, R } = setup(balances, params, derived, fee, rVec, 0);

    const returnValue = MathGyro.divDown(
        MathGyro.mulDown(
            MathGyro.divDown(WAD, WAD - MathGyro.mulDown(ls, MathGyro.mulDown(s, s))),
            MathGyro.mulDown(
                R,
                MathGyro.mulDown(
                    MathGyro.mulDown(
                        MathGyro.mulDown(
                            MathGyro.mulDown(MathGyro.mulDown(ls, s), c),
                            MathGyro.mulDown(lambda, lambda),
                        ),
                        R,
                    ) -
                        (x0 - a),
                    MathGyro.mulDown(
                        MathGyro.mulDown(
                            MathGyro.mulDown(MathGyro.mulDown(ls, s), c),
                            MathGyro.mulDown(lambda, lambda),
                        ),
                        R,
                    ) -
                        (x0 - a),
                ),
            ),
        ),
        MathGyro.mulDown(MathGyro.mulDown(lambda, lambda), MathGyro.mulDown(R, R)) + MathGyro.mulDown(x0 - a, x0 - a),
    );

    return returnValue;
}
