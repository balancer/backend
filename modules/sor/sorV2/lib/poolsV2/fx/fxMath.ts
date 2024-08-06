import { parseUnits } from 'viem';
import { RAY } from '../../utils/math';
import { SwapKind } from '@balancer/sdk';
import { FxPoolPairData } from './types';

export const CURVEMATH_MAX_DIFF = parseUnits('-0.000001000000000000024', 36);
export const ONE_TO_THE_THIRTEEN_NUM = parseUnits('10000000000000', 36);
const CURVEMATH_MAX = parseUnits('0.25', 36);

export enum CurveMathRevert {
    LowerHalt = 'CurveMath/lower-halt',
    UpperHalt = 'CurveMath/upper-halt',
    SwapInvariantViolation = 'CurveMath/swap-invariant-violation',
    SwapConvergenceFailed = 'CurveMath/swap-convergence-failed',
    CannotSwap = 'CannotSwap',
}

export function _calcOutGivenIn(poolPairData: FxPoolPairData): bigint {
    const _amt = calculateTrade(poolPairData);
    if (_amt === undefined) throw new Error(CurveMathRevert.CannotSwap);
    let amountOut = _amt[0];
    amountOut = amountOut < 0n ? amountOut * -1n : amountOut;
    return amountOut;
}

export function _calcInGivenOut(poolPairData: FxPoolPairData): bigint {
    const _amt = calculateTrade(poolPairData);
    if (_amt === undefined) throw new Error(CurveMathRevert.CannotSwap);
    let amountIn = _amt[0];
    amountIn = amountIn < 0n ? amountIn * -1n : amountIn;
    return amountIn;
}

// Curve Math
// calculations are from CurveMath.sol
const calculateMicroFee = (_bal: bigint, _ideal: bigint, _beta: bigint, _delta: bigint): bigint => {
    let _threshold: bigint;
    let _feeMargin: bigint;
    let fee_ = 0n;

    if (_bal < _ideal) {
        _threshold = (_ideal * (RAY - _beta)) / RAY;

        if (_bal < _threshold) {
            _feeMargin = _threshold - _bal;
            fee_ = (_feeMargin * RAY) / _ideal;
            fee_ = (fee_ * _delta) / RAY;

            if (fee_ > CURVEMATH_MAX) {
                fee_ = CURVEMATH_MAX;
            }

            fee_ = (fee_ * _feeMargin) / RAY;
        } else {
            fee_ = 0n;
        }
    } else {
        _threshold = (_ideal * (_beta + RAY)) / RAY;

        if (_bal > _threshold) {
            _feeMargin = _bal - _threshold;

            fee_ = (_feeMargin * RAY) / _ideal;
            fee_ = (fee_ * _delta) / RAY;

            if (fee_ > CURVEMATH_MAX) fee_ = CURVEMATH_MAX;

            fee_ = (fee_ * _feeMargin) / RAY;
        } else {
            fee_ = 0n;
        }
    }

    return fee_;
};

const calculateFee = (_gLiq: bigint, _bals: bigint[], _beta: bigint, _delta: bigint, _weights: bigint[]): bigint => {
    const _length = _bals.length;
    let psi = 0n;

    for (let i = 0; i < _length; i++) {
        const _ideal = (_gLiq * _weights[i]) / RAY;

        // keep away from wei values like how the contract do it
        psi = psi + calculateMicroFee(_bals[i], _ideal, _beta, _delta);
    }

    return psi;
};

// return outputAmount and ngliq
export const calculateTrade = (poolPairData: FxPoolPairData): [bigint, bigint] => {
    const { alpha, beta, delta, lambda, _oGLiq, _nGLiq, _oBals, _nBals, givenToken, swapKind } = poolPairData;

    const weights_: bigint[] = [RAY / 2n, RAY / 2n]; // const for now since all weights are 0.5
    const omega = calculateFee(_oGLiq, _oBals, beta, delta, weights_);

    const _outputIndex = givenToken.index === 0 ? 1 : 0;
    const _inputAmt = swapKind === SwapKind.GivenIn ? givenToken.numeraire : givenToken.numeraire * -1n;

    let outputAmt_ = _inputAmt * -1n;
    let _nGLiq_ = _nGLiq;
    let psi: bigint;

    for (let i = 0; i < 32; i++) {
        psi = calculateFee(_nGLiq_, _nBals, beta, delta, weights_);

        const prevAmount = outputAmt_;

        outputAmt_ =
            omega < psi ? (_inputAmt + (omega - psi)) * -1n : (_inputAmt + (lambda * (omega - psi)) / RAY) * -1n;

        if ((outputAmt_ * RAY) / ONE_TO_THE_THIRTEEN_NUM === (prevAmount * RAY) / ONE_TO_THE_THIRTEEN_NUM) {
            _nGLiq_ = _oGLiq + _inputAmt + outputAmt_;

            _nBals[_outputIndex] = _oBals[_outputIndex] + outputAmt_;
            // throws error already, removed if statement
            enforceHalts(_oGLiq, _nGLiq_, _oBals, _nBals, weights_, alpha);
            enforceSwapInvariant(_oGLiq, omega, _nGLiq_, psi);
            return [outputAmt_, _nGLiq_];
        }
        _nGLiq_ = _oGLiq + _inputAmt + outputAmt_;
        _nBals[_outputIndex] = _oBals[_outputIndex] + outputAmt_;
    }

    throw new Error(CurveMathRevert.SwapConvergenceFailed);
};

// invariant enforcement
const enforceHalts = (
    _oGLiq: bigint,
    _nGLiq: bigint,
    _oBals: bigint[],
    _nBals: bigint[],
    _weights: bigint[],
    alpha: bigint,
): boolean => {
    const _length = _nBals.length;

    for (let i = 0; i < _length; i++) {
        const _nIdeal = (_nGLiq * _weights[i]) / RAY;

        if (_nBals[i] > _nIdeal) {
            const _upperAlpha = alpha + RAY;

            const _nHalt = (_nIdeal * _upperAlpha) / RAY;

            if (_nBals[i] > _nHalt) {
                const _oHalt = (((_oGLiq * _weights[i]) / RAY) * _upperAlpha) / RAY;

                if (_oBals[i] < _oHalt) {
                    throw new Error(CurveMathRevert.UpperHalt);
                }
                if (_nBals[i] - _nHalt > _oBals[i] - _oHalt) {
                    throw new Error(CurveMathRevert.UpperHalt);
                }
            }
        } else {
            const _lowerAlpha = RAY - alpha;

            const _nHalt = (_nIdeal * _lowerAlpha) / RAY;

            if (_nBals[i] < _nHalt) {
                let _oHalt = (_oGLiq * _weights[i]) / RAY;
                _oHalt = (_oHalt * _lowerAlpha) / RAY;

                if (_oBals[i] > _oHalt) {
                    throw new Error(CurveMathRevert.LowerHalt);
                }
                if (_nHalt - _nBals[i] > _oHalt - _oBals[i]) {
                    throw new Error(CurveMathRevert.LowerHalt);
                }
            }
        }
    }
    return true;
};

const enforceSwapInvariant = (_oGLiq: bigint, _omega: bigint, _nGLiq: bigint, _psi: bigint): boolean => {
    const _nextUtil = _nGLiq - _psi;

    const _prevUtil = _oGLiq - _omega;

    const _diff = _nextUtil - _prevUtil;

    // from int128 private constant MAX_DIFF = -0x10C6F7A0B5EE converted to plain decimals
    if (_diff > 0 || _diff >= CURVEMATH_MAX_DIFF) {
        return true;
    }
    throw new Error(CurveMathRevert.SwapInvariantViolation);
};
