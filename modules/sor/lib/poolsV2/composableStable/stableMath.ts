import { MathSol, WAD } from '../../utils/math';

const AMP_PRECISION = 1000n;

export function _calculateInvariant(amplificationParameter: bigint, balances: bigint[], roundUp?: boolean): bigint {
    let sum = 0n;
    const numTokens = balances.length;
    for (let i = 0; i < numTokens; i++) {
        sum += balances[i];
    }

    if (sum === 0n) {
        return 0n;
    }

    let prevInvariant: bigint;
    let invariant = sum;
    const ampTimesTotal = amplificationParameter * BigInt(numTokens);

    for (let i = 0; i < 255; i++) {
        let D_P = invariant;

        for (let j = 0; j < numTokens; j++) {
            D_P = roundUp
                ? MathSol.divUp(D_P * invariant, balances[j] * BigInt(numTokens))
                : (D_P * invariant) / (balances[j] * BigInt(numTokens));
        }

        prevInvariant = invariant;

        invariant = roundUp
            ? MathSol.divUp(
                  ((ampTimesTotal * sum) / AMP_PRECISION + D_P * BigInt(numTokens)) * invariant,
                  MathSol.divUp((ampTimesTotal - AMP_PRECISION) * invariant, AMP_PRECISION) +
                      (BigInt(numTokens) + 1n) * D_P,
              )
            : (((ampTimesTotal * sum) / AMP_PRECISION + D_P * BigInt(numTokens)) * invariant) /
              (((ampTimesTotal - AMP_PRECISION) * invariant) / AMP_PRECISION + (BigInt(numTokens) + 1n) * D_P);

        if (invariant > prevInvariant) {
            if (invariant - prevInvariant <= 1n) {
                return invariant;
            }
        } else if (prevInvariant - invariant <= 1n) {
            return invariant;
        }
    }

    throw new Error('Errors.STABLE_INVARIANT_DIDNT_CONVERGE');
}

export function _calcOutGivenIn(
    amplificationParameter: bigint,
    balances: bigint[],
    tokenIndexIn: number,
    tokenIndexOut: number,
    tokenAmountIn: bigint,
    invariant: bigint,
): bigint {
    balances[tokenIndexIn] = balances[tokenIndexIn] + tokenAmountIn;

    const finalBalanceOut = _getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplificationParameter,
        balances,
        invariant,
        tokenIndexOut,
    );

    balances[tokenIndexIn] = balances[tokenIndexIn] - tokenAmountIn;

    return balances[tokenIndexOut] - finalBalanceOut - 1n;
}

export function _calcInGivenOut(
    amplificationParameter: bigint,
    balances: bigint[],
    tokenIndexIn: number,
    tokenIndexOut: number,
    tokenAmountOut: bigint,
    invariant: bigint,
): bigint {
    balances[tokenIndexOut] = balances[tokenIndexOut] - tokenAmountOut;

    const finalBalanceIn = _getTokenBalanceGivenInvariantAndAllOtherBalances(
        amplificationParameter,
        balances,
        invariant,
        tokenIndexIn,
    );

    balances[tokenIndexOut] = balances[tokenIndexOut] - tokenAmountOut;

    return finalBalanceIn - balances[tokenIndexIn] + 1n;
}

export function _calcBptOutGivenExactTokensIn(
    amp: bigint,
    balances: bigint[],
    amountsIn: bigint[],
    bptTotalSupply: bigint,
    currentInvariant: bigint,
    swapFee: bigint,
): bigint {
    let sumBalances = 0n;
    for (let i = 0; i < balances.length; i++) {
        sumBalances += balances[i];
    }

    const balanceRatiosWithFee = new Array(amountsIn.length);
    let invariantRatioWithFees = 0n;

    for (let i = 0; i < balances.length; i++) {
        const currentWeight = MathSol.divDownFixed(balances[i], sumBalances);
        balanceRatiosWithFee[i] = MathSol.divDownFixed(balances[i] + amountsIn[i], balances[i]);
        invariantRatioWithFees = invariantRatioWithFees + MathSol.mulDownFixed(balanceRatiosWithFee[i], currentWeight);
    }

    const newBalances = new Array(balances.length);
    for (let i = 0; i < balances.length; i++) {
        let amountInWithoutFee: bigint;

        if (balanceRatiosWithFee[i] > invariantRatioWithFees) {
            const nonTaxableAmount = MathSol.mulDownFixed(balances[i], invariantRatioWithFees - WAD);
            const taxableAmount = amountsIn[i] - nonTaxableAmount;

            amountInWithoutFee = nonTaxableAmount + MathSol.mulDownFixed(taxableAmount, WAD - swapFee);
        } else {
            amountInWithoutFee = amountsIn[i];
        }

        newBalances[i] = balances[i] + amountInWithoutFee;
    }

    const newInvariant = _calculateInvariant(amp, newBalances);
    const invariantRatio = MathSol.divDownFixed(newInvariant, currentInvariant);

    if (invariantRatio > WAD) {
        return MathSol.mulDownFixed(bptTotalSupply, invariantRatio - WAD);
    }
    return 0n;
}

export function _calcTokenInGivenExactBptOut(
    amp: bigint,
    balances: bigint[],
    tokenIndex: number,
    bptAmountOut: bigint,
    bptTotalSupply: bigint,
    currentInvariant: bigint,
    swapFee: bigint,
): bigint {
    const newInvariant = MathSol.mulUpFixed(
        MathSol.divUpFixed(bptTotalSupply + bptAmountOut, bptTotalSupply),
        currentInvariant,
    );

    const newBalanceTokenIndex = _getTokenBalanceGivenInvariantAndAllOtherBalances(
        amp,
        balances,
        newInvariant,
        tokenIndex,
    );
    const amountInWithoutFee = newBalanceTokenIndex - balances[tokenIndex];

    let sumBalances = 0n;
    for (let i = 0; i < balances.length; i++) {
        sumBalances += balances[i];
    }

    const currentWeight = MathSol.divDownFixed(balances[tokenIndex], sumBalances);
    const taxablePercentage = MathSol.complementFixed(currentWeight);
    const taxableAmount = MathSol.mulUpFixed(amountInWithoutFee, taxablePercentage);
    const nonTaxableAmount = amountInWithoutFee - taxableAmount;

    return nonTaxableAmount + MathSol.divUpFixed(taxableAmount, WAD - swapFee);
}

export function _calcBptInGivenExactTokensOut(
    amp: bigint,
    balances: bigint[],
    amountsOut: bigint[],
    bptTotalSupply: bigint,
    currentInvariant: bigint,
    swapFee: bigint,
): bigint {
    let sumBalances = 0n;
    for (let i = 0; i < balances.length; i++) {
        sumBalances += balances[i];
    }

    const balanceRatiosWithoutFee = new Array(amountsOut.length);
    let invariantRatioWithoutFees = 0n;
    for (let i = 0; i < balances.length; i++) {
        const currentWeight = MathSol.divUpFixed(balances[i], sumBalances);
        balanceRatiosWithoutFee[i] = MathSol.divUpFixed(balances[i] - amountsOut[i], balances[i]);
        invariantRatioWithoutFees += MathSol.mulUpFixed(balanceRatiosWithoutFee[i], currentWeight);
    }

    const newBalances = new Array(balances.length);
    for (let i = 0; i < balances.length; i++) {
        let amountOutWithFee: bigint;

        if (invariantRatioWithoutFees > balanceRatiosWithoutFee[i]) {
            const nonTaxableAmount = MathSol.mulDownFixed(
                balances[i],
                MathSol.complementFixed(invariantRatioWithoutFees),
            );
            const taxableAmount = amountsOut[i] - nonTaxableAmount;

            amountOutWithFee = nonTaxableAmount + MathSol.divUpFixed(taxableAmount, WAD - swapFee);
        } else {
            amountOutWithFee = amountsOut[i];
        }

        newBalances[i] = balances[i] - amountOutWithFee;
    }

    const newInvariant = _calculateInvariant(amp, newBalances);
    const invariantRatio = MathSol.divDownFixed(newInvariant, currentInvariant);

    return MathSol.mulUpFixed(bptTotalSupply, MathSol.complementFixed(invariantRatio));
}

export function _calcTokenOutGivenExactBptIn(
    amp: bigint,
    balances: bigint[],
    tokenIndex: number,
    bptAmountIn: bigint,
    bptTotalSupply: bigint,
    currentInvariant: bigint,
    swapFee: bigint,
): bigint {
    const newInvariant = MathSol.mulUpFixed(
        MathSol.divUpFixed(bptTotalSupply - bptAmountIn, bptTotalSupply),
        currentInvariant,
    );

    const newBalanceTokenIndex = _getTokenBalanceGivenInvariantAndAllOtherBalances(
        amp,
        balances,
        newInvariant,
        tokenIndex,
    );
    const amountOutWithoutFee = balances[tokenIndex] - newBalanceTokenIndex;

    let sumBalances = 0n;
    for (let i = 0; i < balances.length; i++) {
        sumBalances += balances[i];
    }

    const currentWeight = MathSol.divDownFixed(balances[tokenIndex], sumBalances);
    const taxablePercentage = MathSol.complementFixed(currentWeight);

    const taxableAmount = MathSol.mulUpFixed(amountOutWithoutFee, taxablePercentage);
    const nonTaxableAmount = amountOutWithoutFee - taxableAmount;

    return nonTaxableAmount + MathSol.mulDownFixed(taxableAmount, WAD - swapFee);
}

export function _getTokenBalanceGivenInvariantAndAllOtherBalances(
    amplificationParameter: bigint,
    balances: bigint[],
    invariant: bigint,
    tokenIndex: number,
): bigint {
    const ampTimesTotal = amplificationParameter * BigInt(balances.length);
    let sum = balances[0];
    let P_D = balances[0] * BigInt(balances.length);

    for (let j = 1; j < balances.length; j++) {
        P_D = (P_D * balances[j] * BigInt(balances.length)) / invariant;
        sum += balances[j];
    }

    sum = sum - balances[tokenIndex];
    const inv2 = invariant * invariant;
    const c = MathSol.divUp(inv2, ampTimesTotal * P_D) * AMP_PRECISION * balances[tokenIndex];
    const b = sum + (invariant / ampTimesTotal) * AMP_PRECISION;

    let prevTokenBalance = 0n;
    let tokenBalance = MathSol.divUp(inv2 + c, invariant + b);

    for (let i = 0; i < 255; i++) {
        prevTokenBalance = tokenBalance;
        tokenBalance = MathSol.divUp(tokenBalance * tokenBalance + c, tokenBalance * 2n + b - invariant);

        if (tokenBalance > prevTokenBalance) {
            if (tokenBalance - prevTokenBalance <= 1n) {
                return tokenBalance;
            }
        } else if (prevTokenBalance - tokenBalance <= 1n) {
            return tokenBalance;
        }
    }

    throw new Error('Errors.STABLE_GET_BALANCE_DIDNT_CONVERGE');
}
