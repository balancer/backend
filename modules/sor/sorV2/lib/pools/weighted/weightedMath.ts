// Invariant is used to collect protocol swap fees by comparing its value between two times.
// So we can round always to the same direction. It is also used to initiate the BPT amount
// and, because there is a minimum BPT, we round down the invariant.
import { MathSol, WAD } from '@balancer/sdk';

export function _computeInvariant(normalizedWeights: bigint[], balances: bigint[]) {
    /**********************************************************************************************
   // invariant               _____                                                             //
   // wi = weight index i      | |      wi                                                      //
   // bi = balance index i     | |  bi ^   = i                                                  //
   // i = invariant                                                                             //
   **********************************************************************************************/

    let invariant = WAD;
    for (let i = 0; i < normalizedWeights.length; i++) {
        invariant = MathSol.mulDownFixed(invariant, MathSol.powDownFixed(balances[i], normalizedWeights[i]));
    }

    if (invariant < 0) throw Error('Weighted Invariant < 0');

    return invariant;
}

export function _computeBalance(currentBalance: bigint, weight: bigint, invariantRatio: bigint) {
    /******************************************************************************************
     // calculateBalanceGivenInvariant                                                       //
     // o = balanceOut                                                                        //
     // b = balanceIn                      (1 / w)                                            //
     // w = weight              o = b * i ^                                                   //
     // i = invariantRatio                                                                    //
     ******************************************************************************************/

    // Calculate by how much the token balance has to increase to match the invariantRatio
    const balanceRatio = MathSol.powUpFixed(invariantRatio, MathSol.divUpFixed(WAD, weight));

    return MathSol.mulUpFixed(currentBalance, balanceRatio);
}
