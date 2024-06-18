---
'backend': major
---

First release of the Balancer backend / api v3

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
