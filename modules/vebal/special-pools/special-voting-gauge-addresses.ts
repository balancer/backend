import { hardCodedPools } from './hardcoded-pools';
import { veGauges } from './ve-pools';

/*
  List of voting gauge addresses with special behavior.
  We avoid throwing/capturing sentry errors for this addresses.

  They include:
  - veGauges (veBAL, veUSH, veLIT)
  - Hardcoded pools
  - Other edge case exceptions
*/
export const specialVotingGaugeAddresses = [...veGauges, ...hardCodedPools.map((pool) => pool.gauge.address)];
