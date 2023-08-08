import { hardCodedPools } from './hardcoded-pools';
import { veGauges } from './ve-pools';

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
    /*
          "pool id in gauges.json": "0xb797adfb7b268faeaa90cadbfed464c76ee599cd0002000000000000000005ba",

          Error in our process:
          VotingGauge not found in PrismaPoolStakingGauge:
          {"gaugeAddress":"0xcf5938ca6d9f19c73010c7493e19c02acfa8d24d","network":"POLYGON","isKilled":true,"relativeWeight":0.000004272480965146,"isInSubgraph":true,"recipient":"0x90a6ec799f21a154ab7affd0b34c5f3f129808e2","addedTimestamp":1657479716}
    */
    '0xcf5938ca6d9f19c73010c7493e19c02acfa8d24d',
];
