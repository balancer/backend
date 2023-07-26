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
    ...hardCodedPools.map((pool) => pool.rootGauge.address),

    // Balancer USDC/WETH/L Gauge from Cron Finance
    // https://etherscan.io/address/0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c#readContract
    // We exclude this gauge because Cron Contract is not compliant with BasePool interface so we won't find it the pools from the Subgraph
    '0xc4e72abe8a32fd7d7ba787e1ec860ecb8c0b333c',
];
