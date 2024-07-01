# backend

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
