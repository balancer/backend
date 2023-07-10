import { hardCodedPools } from './hardcoded-pools';
import { veGauges } from './ve-pools';

/*
  List of root gauge addresses with special behavior.
  We avoid throwing/capturing sentry errors for this addresses.

  They include:
  - veGauges (veBAL, veUSH, veLIT)
  - Hardcoded pools
  - Other edge case exceptions
*/
export const specialRootGaugeAddresses = [
    ...veGauges,
    ...hardCodedPools.map((pool) => pool.gauge.address),

    // Balancer USDC/WETH/L Gauge Deposit
    // https://etherscan.io/address/0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c#readContract
    // Valid root gauge without Staking relation (MAINNET??)
    '0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c',

    // ARBITRUM Killed root gauge that shares staking with '0xd758454bdf4df7ad85f7538dc9742648ef8e6d0a' (was failing due to unique constraint)
    '0x3f829a8303455cb36b7bcf3d1bdc18d5f6946aea',

    // '0xf0d887c1f5996c91402eb69ab525f028dd5d7578',
];
