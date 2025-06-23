import request, { gql } from 'graphql-request';

const url = 'https://blue-api.morpho.org/graphql';
const query = gql`
    {
        vaults(first: 1000, where: { netApy_gte: 0.00001 }) {
            items {
                address
                asset {
                    address
                    yield {
                        apr
                    }
                }
                chain {
                    network
                }
                state {
                    fee
                    dailyApy
                    dailyNetApy
                }
            }
        }
    }
`;

/*
Morpho APIs results are as follows:
- dailyApy: Vault APY excluding rewards, before deducting the performance fee. Also NOT including the net APY of the underlying asset.
- dailyNetApy: Vault APY including rewards and underlying yield, after deducting the performance fee.


We only want to get the APY for rewards as we account for underlying yield separately inside the YB APR service. 
We therefore deduct the fee from the apy and subtract the asset yield apr from it.
*/

type Vault = {
    address: string;
    chain: {
        network: string;
    };
    asset: {
        address: string;
        yield?: {
            apr: number;
        };
    };
    state: {
        fee: number;
        dailyApy: number;
        dailyNetApy: number;
    };
};

type BlueApiResponse = {
    vaults: {
        items: Vault[];
    };
};

const mapMorphoNetworkToChain = {
    ethereum: 'MAINNET',
    base: 'BASE',
};

export const morphoApiClient = {
    morphoApr: async () => {
        const {
            vaults: { items },
        } = await request<BlueApiResponse>(url, query);

        // Map apy to vault addresses
        return Object.fromEntries(
            items.map((vault: Vault) => [
                vault.address.toLowerCase(),
                {
                    dailyApy: vault.state.dailyApy,
                    dailyNetApy: vault.state.dailyNetApy,
                    fee: vault.state.fee,
                    rewardApy:
                        vault.state.dailyNetApy -
                        vault.state.dailyApy * (1 - vault.state.fee) -
                        (vault.asset.yield?.apr || 0),
                    chain: mapMorphoNetworkToChain[vault.chain.network as keyof typeof mapMorphoNetworkToChain],
                },
            ]),
        );
    },
};
