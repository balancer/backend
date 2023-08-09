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
    /*
    VotingGauge not found in PrismaPoolStakingGauge:
    {"gaugeAddress":"0xeeded342aa2cc1b48eccafeb663fdf2c1d166934","network":"MAINNET","isKilled":true,"relativeWeight":5.5847934e-11,"relativeWeightCap":"0.02","isInSubgraph":true,"addedTimestamp":1682430623}
    */
    '0xeeded342aa2cc1b48eccafeb663fdf2c1d166934',

    /*
    VotingGauge not found in PrismaPoolStakingGauge:
    {"gaugeAddress":"0x249034a0ea97e76c2b4ab7a1727cbc52548c531c","network":"MAINNET","isKilled":true,"relativeWeight":5.5847934e-11,"relativeWeightCap":"0.02","isInSubgraph":true,"addedTimestamp":1682430623}
    */
    '0x249034a0ea97e76c2b4ab7a1727cbc52548c531c',

    /*****
     * ALIVE GAUGES!!!!!!!
     */
    /*
    VotingGauge not found in PrismaPoolStakingGauge:
     {"gaugeAddress":"0x5c0e6d132c53da7f6e958edf13db0fa02c5b2ec6","network":"POLYGON","isKilled":false,"relativeWeight":0,"relativeWeightCap":"1.0","isInSubgraph":true,"recipient":"0x0c441906e1f0d4e21bfe8bdbb2c300ada48f0e77","addedTimestamp":1691432951}
     */
    '0xeeded342aa2cc1b48eccafeb663fdf2c1d166934',

    /*
    VotingGauge not found in PrismaPoolStakingGauge:
    {"gaugeAddress":"0x2dc55e84baf47296c2cf87b4ec3eb66fd7665611","network":"MAINNET","isKilled":false,"relativeWeight":0,"relativeWeightCap":"0.02","isInSubgraph":true,"addedTimestamp":1691432951}
    */
    '0x2dc55e84baf47296c2cf87b4ec3eb66fd7665611',

    /*
    VotingGauge not found in PrismaPoolStakingGauge:
    {"gaugeAddress":"0x5c0e6d132c53da7f6e958edf13db0fa02c5b2ec6","network":"POLYGON","isKilled":false,"relativeWeight":0,"relativeWeightCap":"1.0","isInSubgraph":true,"recipient":"0x0c441906e1f0d4e21bfe8bdbb2c300ada48f0e77","addedTimestamp":1691432951}
    */
    '0x5c0e6d132c53da7f6e958edf13db0fa02c5b2ec6',

    /*
    VotingGauge not found in PrismaPoolStakingGauge:
    {"gaugeAddress":"0xf07b17dc2f1bca19dde307690b59bae3322faf0f","network":"ARBITRUM","isKilled":false,"relativeWeight":0,"relativeWeightCap":"1.0","isInSubgraph":true,"recipient":"0xde4c39168b404a651bc97fd29fd0f1d1956e894b","addedTimestamp":1691432951}
    */
    '0xf07b17dc2f1bca19dde307690b59bae3322faf0f',
];
