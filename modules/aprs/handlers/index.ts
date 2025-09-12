// Export all handlers implementations
export { SwapFeeAprHandler } from './swap-fee-apr';
export { YbTokensAprHandler } from './yb-tokens';
export { AaveApiAprHandler } from './aave-api-apr';
export { BeetswarsGaugeVotingAprHandler, MaBeetsAprHandler } from './mabeets-apr';
export { MorphoRewardsAprHandler } from './morpho-apr-handler/morpho-rewards-apr-handler';
export { NestedPoolAprHandler } from './nested-pool-apr-handler';
export { QuantAmmAprHandler } from './quant-amm-apr';
export { LiquidityGaugeAprHandler } from './liquidity-gauge-apr';
export { VeBalProtocolAprHandler, VeBalVotingAprHandler } from './vebal-apr';
export { MerklAprHandler } from './merkl-apr';

export { createHandlers } from './create-handlers';
