import { MathSol, WAD } from '../../../utils/math';
import { Params } from './types';

export function _calcWrappedOutPerMainIn(
    mainIn: bigint,
    mainBalance: bigint,
    params: Params,
): bigint {
    // Amount out, so we round down overall.
    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = _toNominal(mainBalance + mainIn, params);

    return afterNominalMain - previousNominalMain;
}

export function _calcBptOutPerMainIn(
    mainIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params,
): bigint {
    // Amount out, so we round down overall.

    if (bptSupply === 0n) {
        return _toNominal(mainIn, params);
    }

    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = _toNominal(mainBalance + mainIn, params);
    const deltaNominalMain = afterNominalMain - previousNominalMain;
    const invariant = _calcInvariant(previousNominalMain, wrappedBalance);

    return (bptSupply * deltaNominalMain) / invariant;
}

export function _calcMainOutPerWrappedIn(
    wrappedIn: bigint,
    mainBalance: bigint,
    params: Params,
): bigint {
    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = previousNominalMain - wrappedIn;
    const newMainBalance = _fromNominal(afterNominalMain, params);

    return mainBalance - newMainBalance;
}

export function _calcBptOutPerWrappedIn(
    wrappedIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params,
): bigint {
    if (bptSupply === 0n) {
        return wrappedIn;
    }

    const nominalMain = _toNominal(mainBalance, params);
    const previousInvariant = _calcInvariant(nominalMain, wrappedBalance);
    const newWrappedBalance = wrappedBalance + wrappedIn;
    const newInvariant = _calcInvariant(nominalMain, newWrappedBalance);
    const newBptBalance = (bptSupply * newInvariant) / previousInvariant;

    return newBptBalance - bptSupply;
}

export function _calcMainOutPerBptIn(
    bptIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params,
): bigint {
    // Amount out, so we round down overall.
    const previousNominalMain = _toNominal(mainBalance, params);
    const invariant = _calcInvariant(previousNominalMain, wrappedBalance);
    const deltaNominalMain = (invariant * bptIn) / bptSupply;
    const afterNominalMain = previousNominalMain - deltaNominalMain;
    const newMainBalance = _fromNominal(afterNominalMain, params);

    return mainBalance - newMainBalance;
}

export function _calcWrappedOutPerBptIn(
    bptIn: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params,
): bigint {
    const nominalMain = _toNominal(mainBalance, params);
    const previousInvariant = _calcInvariant(nominalMain, wrappedBalance);
    const newBptBalance = bptSupply - bptIn;
    const newWrappedBalance =
        (newBptBalance * previousInvariant) / bptSupply - nominalMain;

    return wrappedBalance - newWrappedBalance;
}

export function _calcMainInPerWrappedOut(
    wrappedOut: bigint,
    mainBalance: bigint,
    params: Params,
): bigint {
    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = previousNominalMain + wrappedOut;
    const newMainBalance = _fromNominal(afterNominalMain, params);

    return newMainBalance - mainBalance;
}

export function _calcMainInPerBptOut(
    bptOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params,
): bigint {
    if (bptSupply === 0n) {
        return _fromNominal(bptOut, params);
    }
    const previousNominalMain = _toNominal(mainBalance, params);
    const invariant = _calcInvariant(previousNominalMain, wrappedBalance);
    const deltaNominalMain = (invariant * bptOut) / bptSupply;
    const afterNominalMain = previousNominalMain + deltaNominalMain;
    const newMainBalance = _fromNominal(afterNominalMain, params);

    return newMainBalance - mainBalance;
}

export function _calcWrappedInPerMainOut(
    mainOut: bigint,
    mainBalance: bigint,
    params: Params,
): bigint {
    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = _toNominal(mainBalance - mainOut, params);

    return previousNominalMain - afterNominalMain;
}

export function _calcWrappedInPerBptOut(
    bptOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params,
): bigint {
    if (bptSupply === 0n) {
        return bptOut;
    }

    const nominalMain = _toNominal(mainBalance, params);
    const previousInvariant = _calcInvariant(nominalMain, wrappedBalance);
    const newBptBalance = bptSupply + bptOut;
    const newWrappedBalance =
        (newBptBalance * previousInvariant) / bptSupply - nominalMain;

    return newWrappedBalance - wrappedBalance;
}

export function _calcBptInPerWrappedOut(
    wrappedOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params,
): bigint {
    const nominalMain = _toNominal(mainBalance, params);
    const previousInvariant = _calcInvariant(nominalMain, wrappedBalance);
    const newWrappedBalance = wrappedBalance - wrappedOut;
    const newInvariant = _calcInvariant(nominalMain, newWrappedBalance);
    const newBptBalance = (bptSupply * newInvariant) / previousInvariant;

    return bptSupply - newBptBalance;
}

export function _calcBptInPerMainOut(
    mainOut: bigint,
    mainBalance: bigint,
    wrappedBalance: bigint,
    bptSupply: bigint,
    params: Params,
): bigint {
    const previousNominalMain = _toNominal(mainBalance, params);
    const afterNominalMain = _toNominal(mainBalance - mainOut, params);
    const deltaNominalMain = previousNominalMain - afterNominalMain;
    const invariant = _calcInvariant(previousNominalMain, wrappedBalance);

    return (bptSupply * deltaNominalMain) / invariant;
}

function _calcInvariant(
    nominalMainBalance: bigint,
    wrappedBalance: bigint,
): bigint {
    return nominalMainBalance + wrappedBalance;
}

function _toNominal(real: bigint, params: Params): bigint {
    // Fees are always rounded down: either direction would work but we need to be consistent, and rounding down
    // uses less gas.
    if (real < params.lowerTarget) {
        const fees = MathSol.mulDownFixed(
            params.lowerTarget - real,
            params.fee,
        );
        return real - fees;
    }
    if (real <= params.upperTarget) {
        return real;
    }
    const fees = MathSol.mulDownFixed(real - params.upperTarget, params.fee);
    return real - fees;
}

function _fromNominal(nominal: bigint, params: Params): bigint {
    // Since real = nominal + fees, rounding down fees is equivalent to rounding down real.
    if (nominal < params.lowerTarget) {
        return MathSol.divDownFixed(
            nominal + MathSol.mulDownFixed(params.fee, params.lowerTarget),
            WAD + params.fee,
        );
    }
    if (nominal <= params.upperTarget) {
        return nominal;
    }
    return MathSol.divDownFixed(
        nominal - MathSol.mulDownFixed(params.fee, params.upperTarget),
        WAD - params.fee,
    );
}
