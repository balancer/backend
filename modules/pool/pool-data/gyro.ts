import { BalancerPoolFragment } from '../../subgraphs/balancer-subgraph/generated/balancer-subgraph-types';

export const gyro = (pool: BalancerPoolFragment) => {
    return {
        alpha: pool.alpha || '',
        beta: pool.beta || '',
        sqrtAlpha: pool.sqrtAlpha || '',
        sqrtBeta: pool.sqrtBeta || '',
        root3Alpha: pool.root3Alpha || '',
        c: pool.c || '',
        s: pool.s || '',
        lambda: pool.lambda || '',
        tauAlphaX: pool.tauAlphaX || '',
        tauAlphaY: pool.tauAlphaY || '',
        tauBetaX: pool.tauBetaX || '',
        tauBetaY: pool.tauBetaY || '',
        u: pool.u || '',
        v: pool.v || '',
        w: pool.w || '',
        z: pool.z || '',
        dSq: pool.dSq || '',
    };
};
