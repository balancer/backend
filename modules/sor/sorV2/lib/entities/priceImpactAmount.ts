import { formatEther, parseEther } from 'viem';
import { BigintIsh } from './tokenAmount';

export class PriceImpactAmount {
    public amount: bigint; // raw amount in wei (i.e. 18 decimals)
    public decimal: number; // decimal = wei * 1e-18
    public percentage: number; // percentage = decimal * 1e-2
    public bps: number; // bps = basis points = decimal * 1e-4

    public static fromRawAmount(rawAmount: BigintIsh) {
        return new PriceImpactAmount(rawAmount);
    }

    public static fromDecimal(decimalAmount: `${number}`) {
        const rawAmount = parseEther(decimalAmount);
        return PriceImpactAmount.fromRawAmount(rawAmount);
    }

    public static fromPercentage(percentageAmount: `${number}`) {
        const decimalAmount = Number(percentageAmount) / 100;
        return PriceImpactAmount.fromDecimal(`${decimalAmount}`);
    }

    public static fromBasisPoints(bpsAmount: `${number}`) {
        const decimalAmount = Number(bpsAmount) / 10000;
        return PriceImpactAmount.fromDecimal(`${decimalAmount}`);
    }

    protected constructor(amount: BigintIsh) {
        this.amount = BigInt(amount);
        this.decimal = parseFloat(formatEther(this.amount));
        this.percentage = this.decimal * 100;
        this.bps = this.decimal * 10000;
    }
}
