# backend

## 1.5.3

### Patch Changes

-   22bc735: Update cow-amm subgraphs, add gnosis

## 1.5.2

### Patch Changes

-   c31cef8: new cow amm subgraph, fix surplus calc
-   d72fec7: fix scaling for cow pool data

## 1.5.1

### Patch Changes

-   40631b9: change fantom rpc
-   0fd0952: change cow amm subgraph to deployment id
-   64cdecc: more robust aura sync
-   4cfbf0e: add gUSDC apr

## 1.5.0

### Minor Changes

-   ed09091: split controllers, reload also syncs pool state

### Patch Changes

-   846b2ad: allow test env to use paid rpc
-   0b421c5: fix exact_out with getBestSwapPathVersion
-   2dbbb7c: fix initial cow amm sync
-   2366ee3: add cow crons to mainnet and adapt cron intervalls
-   f12b5b2: fix initUserBalances for local runs

## 1.4.3

### Patch Changes

-   43735c9: fix sfrax apr on fraxtal

## 1.4.2

### Patch Changes

-   3613c9f: reduce multicall batch size

## 1.4.1

### Patch Changes

-   6daa985: smaller chunks for pool fetching

## 1.4.0

### Minor Changes

-   d4caec8: Cow AMM aprs calculated from daily surplus

### Patch Changes

-   812bdba: return filename only for rateprovider review

## 1.3.2

### Patch Changes

-   6429e7a: Adding new pool filter tags tagIn and tagNotIn. These replace categoryIn/categoryNotIn removing enum constraint.
-   f816e93: changed the events query ordering from blockNumber to blockTimestamp to mitigate different chain height.
-   21da677: adding gyro config on gnosis chain
-   8389be2: using pool instead of global variables in ybTokenService
-   34a7a8c: fix aura and gauge user balance sync
-   5604fd9: exposing tags
-   57bbc2a: fix tracking of balance if last relic was transferred

## 1.3.1

### Patch Changes

-   95b752f: fixing missing files in metadata repo
-   480c22c: add cache to db query in SOR
-   2dc67f1: fix fantom blocks subgraph url

## 1.3.0

### Minor Changes

-   331c657: adding metadata categories from the github repo
-   2b1cbec: adding merkl reward aprs

### Patch Changes

-   4009872: adding missing fields to rate provider reviews
-   7397078: use subgraph deployment IDs instead of subgraph id
-   76c8176: Exclude current round from HiddenHand APRs
-   cbea2e0: limiting events query results set to 1000 records
-   bccc7a5: adding indexes to token related tables
-   614383b: breaking - making events query filter optional and allowing multiple chains

## 1.2.0

### Minor Changes

-   d8752b4: adding vebal as a staking option

### Patch Changes

-   b03f0ce: fix aura apr scaling
-   b3aedfc: Increase swap size to 100 USD for normalized liquidity calculation. Also only use pools that have >=1000USD tvl
-   e8e8bcc: adding SOR support for vault v3 - swaps only
-   ddb3616: moving snapshot syncing to a separate functions
-   e643603: updated AAVE subgraph URLs for getting token APRs
-   b071980: adding backsyncing task for filling up subgraph swaps
-   abc67d0: exposing aura pool id and shutdown flag for aura staking

## 1.1.0

### Minor Changes

-   a7711cb: Adding incentivized field to the pool response type
-   7fcea18: add cow-amm support for swaps, add, removes and snapshots. Also incorporate surplus

### Patch Changes

-   deb7c03: adjust syncs to newest vault v3 version
-   455bb0b: rename join/exit to add/remove for v3 subgraph
-   755e873: config fix
-   95e5636: fix: removing renamed vaultVersion column
-   4465dbf: adding poolToken -> balanceUSD
-   798c947: adding chain and user address as query params to vebal queries
-   0851e56: Update to newest v3 subgraph. Adjust balances etc from wei to floats
-   8961dfb: handle missing tokens in subgraph pools
-   1021114: fix voting apr timestamp to use UTC
-   489cf3e: removing duplicated vebal locks subgraph url

## 1.0.1

### Patch Changes

-   07a7fc9: make the workflow manual

## 1.0.0

### Major Changes

-   30b1148: First release of the Balancer backend / api v3

    This marks the first release for the API v3. With the release of ZEN, the following queries are deprecated and shall not be used anymore:

    -   poolGetSwaps
    -   poolGetBatchSwaps
    -   poolGetJoinExits
    -   poolGetFeaturedPoolGroups
    -   tokenGetPriceChartData
    -   tokenGetCandlestickChartData
    -   tokenGetTokenData
    -   tokenGetTokensData
    -   tokenGetProtocolTokenPrice

    The following fields and types are deprecated:

    -   vaultVersion
    -   investConfig
    -   GqlPoolInvestConfig
    -   GqlPoolInvestOption
    -   withdrawConfig
    -   GqlPoolWithdrawConfig
    -   GqlPoolWithdrawOption
    -   apr
    -   GqlPoolApr
    -   GqlPoolAprValue
    -   GqlPoolAprRange
    -   GqlPoolAprTotal
    -   tokens
    -   GqlPoolNestedUnion
    -   GqlPoolTokenComposableStableNestedUnion
    -   GqlPoolTokenBase
    -   GqlPoolToken
    -   GqlPoolTokenComposableStable

    See the gql files to find the suitable replacements.

### Minor Changes

-   34a7d70: update sftmx vaults when they are matured
