import { TokenYieldHandler } from '../../types';

const query = `query getReserves($aTokens: [String!], $underlyingAssets: [Bytes!]) {
  reserves(
    where: {
      aToken_in: $aTokens
      underlyingAsset_in: $underlyingAssets
      isActive: true
    }
  ) {
    id
    underlyingAsset
    liquidityRate
  }
}`;

export const avalonYieldHandler: TokenYieldHandler = async ({
    subgraphUrl,
    tokens,
}: {
    subgraphUrl: string;
    tokens: {
        [underlyingAssetName: string]: {
            underlyingAssetAddress: string;
            aTokenAddress: string;
            wrappedTokens: {
                [wrappedTokenName: string]: string;
            };
            isIbYield?: boolean;
        };
    };
}) => {
    try {
        const requestQuery = {
            operationName: 'getReserves',
            query,
            variables: {
                aTokens: Object.values(tokens).map(({ aTokenAddress }) => aTokenAddress),
                underlyingAssets: Object.values(tokens).map(({ underlyingAssetAddress }) => underlyingAssetAddress),
            },
        };
        const {
            data: { reserves },
        } = await fetch(subgraphUrl, {
            method: 'POST',
            body: JSON.stringify(requestQuery),
            headers: { 'Content-Type': 'application/json' },
        }).then((response) => response.json() as Promise<ReserveResponse>);

        const aprsByUnderlyingAddress = Object.fromEntries(
            reserves.map((r) => [
                r.underlyingAsset,
                // Converting from aave ray number (27 digits) to float
                Number(r.liquidityRate.slice(0, 27)) / 1e27,
            ]),
        );
        const aprEntries = Object.values(tokens).flatMap(({ wrappedTokens, underlyingAssetAddress }) => {
            const apr = aprsByUnderlyingAddress[underlyingAssetAddress];
            return Object.values(wrappedTokens).map((wrappedTokenAddress) => ({
                address: wrappedTokenAddress,
                apr,
            }));
        });
        return aprEntries;
    } catch (e) {
        throw Error(`Failed to fetch Aave APR in subgraph ${subgraphUrl}: ${(e as Error).message}`);
    }
};

interface ReserveResponse {
    data: {
        reserves: [
            {
                underlyingAsset: string;
                liquidityRate: string;
            },
        ];
    };
}
