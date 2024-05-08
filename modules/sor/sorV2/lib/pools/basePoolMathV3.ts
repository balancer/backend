import { WAD } from '@balancer/sdk';
import { MathSol } from '../utils/math';

export function computeAddLiquiditySingleTokenExactOut(
    currentBalances: bigint[],
    tokenInIndex: number,
    bptAmountOut: bigint,
    totalSupply: bigint,
    swapFeePercentage: bigint,
    computeBalance: Function,
) {
    // Calculate new supply after minting exactBptAmountOut
    const newBptSupply = totalSupply + bptAmountOut;
    // Calculate the initial amount of the input token needed for the desired amount of BPT out
    // "divUp" leads to a higher "newBalance", which in turn results in a larger "amountIn".
    // This leads to receiving more tokens for the same amount of BPT minted.
    const newBalance = computeBalance(currentBalances, tokenInIndex, (newBptSupply * WAD) / totalSupply);
    // Compute the amount to be deposited into the pool.
    const amountIn = newBalance - currentBalances[tokenInIndex];

    // Calculate the non-taxable amount, which is the new balance proportionate to the BPT minted.
    // Round the `nonTaxableBalance` down to favor the protocol by increasing the taxable amount, which charges
    // higher swap fees, ultimately increasing the amount of `tokenIn` that will be transferred from the caller.
    const nonTaxableBalance = MathSol.divDownFixed(
        MathSol.mulDownFixed(newBptSupply, currentBalances[tokenInIndex]),
        totalSupply,
    );
    // Calculate the taxable amount, which is the difference
    // between the actual new balance and the non-taxable balance
    const taxableAmount = newBalance - nonTaxableBalance;
    // Calculate the swap fee based on the taxable amount and the swap fee percentage
    const fee = MathSol.divUpFixed(taxableAmount, MathSol.complementFixed(swapFeePercentage)) - taxableAmount;
    // Create swap fees amount array and set the single fee we charge
    const swapFeeAmounts: bigint[] = Array(currentBalances.length).fill(0n);
    swapFeeAmounts[tokenInIndex] = fee;
    const amountInWithFee = amountIn + fee;
    // Return the total amount of input token needed, including the swap fee
    return { amountInWithFee, swapFeeAmounts };
}

export function computeRemoveLiquiditySingleTokenExactOut(
    currentBalances: bigint[],
    tokenOutIndex: number,
    exactAmountOut: bigint,
    totalSupply: bigint,
    swapFeePercentage: bigint,
    computeInvariant: Function,
) {
    // Determine the number of tokens in the pool.
    const numTokens: number = currentBalances.length;

    // Create a new array to hold the updated balances.
    const newBalances: bigint[] = Array(numTokens);

    // Copy currentBalances to newBalances
    for (let i = 0; i < numTokens; i++) {
        newBalances[i] = currentBalances[i];
    }

    // Update the balance of tokenOutIndex with exactAmountOut.
    newBalances[tokenOutIndex] = newBalances[tokenOutIndex] - exactAmountOut;

    // Calculate the invariant using the current balances (before the removal).
    const currentInvariant = computeInvariant(currentBalances) as bigint;

    // Calculate the new invariant using the new balances (after the removal).
    // Calculate the new invariant ratio by dividing the new invariant by the old invariant.
    // Calculate the new proportional balance by multiplying the new invariant ratio by the current balance.
    // Calculate the taxable amount by subtracting the new balance from the equivalent proportional balance,
    // rounding in favor of the protocol. We round the first term up to subtract from more and get a higher
    // `taxableAmount`, which charges higher swap fees, augmenting the amount of BPT that will be burned.
    const taxableAmount =
        MathSol.mulUpFixed(
            MathSol.divUpFixed(computeInvariant(newBalances), currentInvariant),
            currentBalances[tokenOutIndex],
        ) - newBalances[tokenOutIndex];

    // Calculate the swap fee based on the taxable amount and the swap fee percentage
    const fee = MathSol.divUpFixed(taxableAmount, MathSol.complementFixed(swapFeePercentage)) - taxableAmount;

    // Update new balances array with a fee
    newBalances[tokenOutIndex] = newBalances[tokenOutIndex] - fee;

    // Calculate the new invariant with fees applied.
    const invariantWithFeesApplied = computeInvariant(newBalances);

    // Create swap fees amount array and set the single fee we charge
    const swapFeeAmounts: bigint[] = Array(numTokens).fill(0n);
    swapFeeAmounts[tokenOutIndex] = fee;

    // Calculate the amount of BPT to burn. This is done by multiplying the
    // total supply with the ratio of the change in invariant.
    // mulUp/divUp maximizes the amount of pool tokens to burn for security reasons.
    const bptAmountIn = MathSol.divUpFixed(
        MathSol.mulUpFixed(totalSupply, currentInvariant - invariantWithFeesApplied),
        currentInvariant,
    );
    return { bptAmountIn, swapFeeAmounts };
}

export function computeRemoveLiquiditySingleTokenExactIn(
    currentBalances: bigint[],
    tokenOutIndex: number,
    exactBptAmountIn: bigint,
    totalSupply: bigint,
    swapFeePercentage: bigint,
    computeBalance: Function,
) {
    // Calculate new supply accounting for burning exactBptAmountIn
    const newSupply = totalSupply - exactBptAmountIn;
    // Calculate the new balance of the output token after the BPT burn.
    // "divUp" leads to a higher "newBalance", which in turn results in a lower "amountOut", but also a lower
    // "taxableAmount". Although the former leads to giving less tokens for the same amount of BPT burned,
    // the latter leads to charging less swap fees. In consequence, a conflict of interests arises regarding
    // the rounding of "newBalance"; we prioritize getting a lower "amountOut".
    const newBalance = computeBalance(currentBalances, tokenOutIndex, MathSol.divUpFixed(newSupply, totalSupply));

    // Compute the amount to be withdrawn from the pool.
    const amountOut = currentBalances[tokenOutIndex] - newBalance;

    // Calculate the new balance proportionate to the BPT burnt.
    // Round the `newBalanceBeforeTax` up to favor the protocol by increasing the taxable amount, which charges
    // higher swap fees, ultimately decreasing the amount of `tokenOut` that will be transferred to the caller.
    const newBalanceBeforeTax = MathSol.divUpFixed(
        MathSol.mulUpFixed(newSupply, currentBalances[tokenOutIndex]),
        totalSupply,
    );

    // Compute the taxable amount: the difference between the new proportional and disproportional balances.
    const taxableAmount = newBalanceBeforeTax - newBalance;

    // Calculate the swap fee on the taxable amount.
    const fee = MathSol.mulUpFixed(taxableAmount, swapFeePercentage);

    // Create swap fees amount array and set the single fee we charge
    let swapFeeAmounts: bigint[] = Array(currentBalances.length).fill(0n);
    swapFeeAmounts[tokenOutIndex] = fee;

    // Return the net amount after subtracting the fee.
    const amountOutWithFee = amountOut - fee;
    return { swapFeeAmounts, amountOutWithFee };
}

function computeAddLiquidityUnbalanced(
    currentBalances: bigint[],
    exactAmounts: bigint[],
    totalSupply: bigint,
    swapFeePercentage: bigint,
    computeInvariant: Function,
) {
    /***********************************************************************
     //                                                                    //
     // s = totalSupply                                 (iFees - iCur)     //
     // b = tokenBalance                  bptOut = s *  --------------     //
     // bptOut = bptAmountOut                                iCur          //
     // iFees = invariantWithFeesApplied                                   //
     // iCur = currentInvariant                                            //
     // iNew = newInvariant                                                //
     ***********************************************************************/

    // Determine the number of tokens in the pool.
    const numTokens = currentBalances.length;

    // Create a new array to hold the updated balances after the addition.
    const newBalances: bigint[] = Array(numTokens).fill(0n);
    // Create a new array to hold the swap fee amount for each token.
    const swapFeeAmounts: bigint[] = Array(numTokens).fill(0n);

    // Loop through each token, updating the balance with the added amount.
    for (let i = 0; i < numTokens; ++i) {
        newBalances[i] = currentBalances[i] + exactAmounts[i];
    }

    // Calculate the invariant using the current balances (before the addition).
    const currentInvariant = computeInvariant(currentBalances);

    // Calculate the new invariant using the new balances (after the addition).
    const newInvariant = computeInvariant(newBalances);

    // Calculate the new invariant ratio by dividing the new invariant by the old invariant.
    const invariantRatio = newInvariant.divDown(currentInvariant);

    // Loop through each token to apply fees if necessary.
    for (let i = 0; i < numTokens; ++i) {
        // Check if the new balance is greater than the equivalent proportional balance.
        // If so, calculate the taxable amount, rounding in favor of the protocol.
        // We round the second term down to subtract less and get a higher `taxableAmount`,
        // which charges higher swap fees, reducing the amount of BPT that will be minted.
        if (newBalances[i] > invariantRatio.mulDown(currentBalances[i])) {
            const taxableAmount = newBalances[i] - invariantRatio.mulDown(currentBalances[i]);
            // Calculate fee amount
            swapFeeAmounts[i] = MathSol.mulUpFixed(taxableAmount, swapFeePercentage);
            // Subtract the fee from the new balance.
            // We are essentially imposing swap fees on non-proportional incoming amounts.
            newBalances[i] = newBalances[i] - swapFeeAmounts[i];
        }
    }

    // Calculate the new invariant with fees applied.
    const invariantWithFeesApplied: bigint = computeInvariant(newBalances);

    // Calculate the amount of BPT to mint. This is done by multiplying the
    // total supply with the ratio of the change in invariant.
    // mulDown/divDown minimizes the amount of pool tokens to mint for security reasons.
    const bptAmountOut = MathSol.divDownFixed(
        MathSol.mulDownFixed(totalSupply, invariantWithFeesApplied - currentInvariant),
        currentInvariant,
    );

    return { swapFeeAmounts, bptAmountOut };
}
