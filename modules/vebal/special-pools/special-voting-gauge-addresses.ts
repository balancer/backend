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

    /*

    "pool id in gauges.json": "0xcc65a812ce382ab909a11e434dbf75b34f1cc59d000200000000000000000001",

    Error: VotingGauge not found in PrismaPoolStakingGauge:
    {"gaugeAddress":"0x6823dca6d70061f2ae2aaa21661795a2294812bf","network":"ARBITRUM","isKilled":true,"relativeWeight":1.921078491e-9,"isInSubgraph":true,"recipient":"0xd5cd8328d93bf4bef9824fd288f32c8f0da1c551","addedTimestamp":1650405644}
    */
    '0x6823dca6d70061f2ae2aaa21661795a2294812bf',

    /*

   "pool id in gauges.json": "0xaf5e0b5425de1f5a630a8cb5aa9d97b8141c908d000200000000000000000366",

    VotingGauge not found in PrismaPoolStakingGauge:
    {"gaugeAddress":"0xc3bb46b8196c3f188c6a373a6c4fde792ca78653","network":"POLYGON","isKilled":true,"relativeWeight":5.936682426e-8,"isInSubgraph":true,"recipient":"0x0fd7e9171b4dc9d89e157c2cc9a424cd9c40a034","addedTimestamp":1650405699}
    */
    '0xc3bb46b8196c3f188c6a373a6c4fde792ca78653',
];
