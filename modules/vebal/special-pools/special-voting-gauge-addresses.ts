import { hardCodedPools } from './hardcoded-pools';
import { veGauges } from './ve-pools';

// We ignore this gauge because it is the old veBal gauge address that was replaced by a new one (0xb78543e00712c3abba10d0852f6e38fde2aaba4d in veGauges.ts)
export const oldVeBalAddress = '0xe867ad0a48e8f815dc0cda2cdb275e0f163a480b';

/*
  List of voting gauge addresses with special behavior.
  We avoid throwing/capturing sentry errors for this addresses.

  They include:
  - veGauges (veBAL, veUSH, veLIT)
  - Hardcoded pools
  - Other edge case exceptions
*/
export const specialVotingGaugeAddresses = [
    ...veGauges,
    ...hardCodedPools.map((pool) => pool.gauge.address),
    oldVeBalAddress,
    // Ignore this old CRON TWAMM gauge instead of hardcoding it
    '0xeeded342aa2cc1b48eccafeb663fdf2c1d166934',
    // Ignore this killed old wrong gauge
    // https://etherscan.io/address/0x249034a0ea97e76c2b4ab7a1727cbc52548c531c
    '0x249034a0ea97e76c2b4ab7a1727cbc52548c531c',
];
