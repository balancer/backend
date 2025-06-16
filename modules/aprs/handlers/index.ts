// Export all handlers implementations
export { SwapFeeAprHandler } from './swap-fee-apr';
export { YbTokensAprHandler } from './yb-tokens';
export { AaveApiAprHandler } from './aave-api-apr';
export { DynamicSwapFeeAprHandler } from './dynamic-swap-fee-apr';
export { BeetswarsGaugeVotingAprHandler, MaBeetsAprHandler } from './mabeets-apr';
export { MorphoRewardsAprHandler } from './morpho-apr-handler/morpho-rewards-apr-handler';
export { NestedPoolAprHandler } from './nested-pool-apr-handler';

// Add more handler exports as they are implemented
// Example:
// export { GaugeAprHandler } from './gauge-apr-handler';

export { createHandlers } from './create-handlers';
