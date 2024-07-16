import { SwapKind } from '@balancer/sdk';
import { FxPoolToken } from './fxPoolToken';

export type FxPoolPairData = {
    tIn: FxPoolToken;
    tOut: FxPoolToken;
    alpha: bigint;
    beta: bigint;
    delta: bigint;
    lambda: bigint;
    _oGLiq: bigint;
    _nGLiq: bigint;
    _oBals: bigint[];
    _nBals: bigint[];
    givenToken: FxPoolToken;
    swapKind: SwapKind;
};
