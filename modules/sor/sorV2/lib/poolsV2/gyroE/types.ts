export type GyroEParams = {
    alpha: bigint;
    beta: bigint;
    c: bigint;
    s: bigint;
    lambda: bigint;
};

export type Vector2 = {
    x: bigint;
    y: bigint;
};

export type DerivedGyroEParams = {
    tauAlpha: Vector2;
    tauBeta: Vector2;
    u: bigint;
    v: bigint;
    w: bigint;
    z: bigint;
    dSq: bigint;
};
