import { parseUnits } from 'viem';
import { Token } from '../../token';
import { TokenAmount, BigintIsh } from '../../tokenAmount';
import { WAD } from '../../../utils/math';
import { _calcInGivenOut, _calcOutGivenIn } from './fxMath';
import { HumanAmount } from '../../../data/types';
import { MathFx } from './helpers';

export class FxPoolToken extends TokenAmount {
    public readonly index: number;
    public readonly latestFXPrice: HumanAmount;
    public readonly fxOracleDecimals: number;
    public numeraire: bigint; // in 36 decimals
    private readonly scalar36 = this.scalar * WAD;

    public constructor(
        token: Token,
        amount: BigintIsh,
        latestFXPrice: HumanAmount,
        fxOracleDecimals: number,
        index: number,
    ) {
        super(token, amount);
        this.latestFXPrice = latestFXPrice;
        this.fxOracleDecimals = fxOracleDecimals;
        const truncatedNumeraire = MathFx.mulDownFixed(
            this.amount,
            parseUnits(this.latestFXPrice, this.fxOracleDecimals),
            this.fxOracleDecimals,
        );
        this.numeraire = truncatedNumeraire * this.scalar36;
        this.index = index;
    }

    public increase(amount: bigint): TokenAmount {
        this.amount = this.amount + amount;
        this.scale18 = this.amount * this.scalar;
        const truncatedNumeraire = MathFx.mulDownFixed(
            this.amount,
            parseUnits(this.latestFXPrice, this.fxOracleDecimals),
            this.fxOracleDecimals,
        );
        this.numeraire = truncatedNumeraire * this.scalar36;
        return this;
    }

    public decrease(amount: bigint): TokenAmount {
        this.amount = this.amount - amount;
        this.scale18 = this.amount * this.scalar;
        const truncatedNumeraire = MathFx.mulDownFixed(
            this.amount,
            parseUnits(this.latestFXPrice, this.fxOracleDecimals),
            this.fxOracleDecimals,
        );
        this.numeraire = truncatedNumeraire * this.scalar36;
        return this;
    }

    public static fromNumeraire(
        poolToken: FxPoolToken,
        numeraire: BigintIsh,
        divUp?: boolean,
    ): FxPoolToken {
        const truncatedNumeraire = BigInt(numeraire) / poolToken.scalar36; // loss of precision required to match SC implementation
        const amount = divUp
            ? MathFx.divUpFixed(
                  BigInt(truncatedNumeraire),
                  parseUnits(
                      poolToken.latestFXPrice,
                      poolToken.fxOracleDecimals,
                  ),
                  poolToken.fxOracleDecimals,
              )
            : MathFx.divDownFixed(
                  BigInt(truncatedNumeraire),
                  parseUnits(
                      poolToken.latestFXPrice,
                      poolToken.fxOracleDecimals,
                  ),
                  poolToken.fxOracleDecimals,
              );
        return new FxPoolToken(
            poolToken.token,
            amount,
            poolToken.latestFXPrice,
            poolToken.fxOracleDecimals,
            poolToken.index,
        );
    }
}
