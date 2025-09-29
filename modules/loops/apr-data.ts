import { OnchainLoopsData } from './onchain-data';

export async function calculateLoopsApr(onchainData: OnchainLoopsData): Promise<number> {
    // get stS apr
    // get aave S borrow apr
    // get aave merit incentive APR

    // calculate loops APR as (stS APR * collateralAmount + aave merit incentive apr * debtAmount - Aave S borrow APR * debtAmount) / actualSupply

    return 0.15;
}
