import request, { gql } from 'graphql-request';

const url = 'https://blue-api.morpho.org/graphql';
const query = gql`
    {
        vaults(first: 1000, where: { netApy_gte: 0.00001 }) {
            items {
                address
                chain {
                    network
                }
                state {
                    apy
                    fee
                    netApyWithoutRewards
                }
            }
        }
    }
`;

/*
Morpho APIs results are as follows:
- apy: Vault APY excluding rewards, before deducting the performance fee. Also NOT including the net APY of the underlying asset.
- netApy: Vault APY including rewards and underlying yield, after deducting the performance fee.
- netApyWithoutRewards: Vault APY excluding rewards, after deducting the performance fee. Also NOT including the net APY of the underlying asset.
- fee: Vault performance fee.

We only want to get the APY for rewards as we account for underlying yield separately inside the YB APR service. 
We therefore deduct the fee from the apy and subgtract the netApyWithoutRewards from it as both these numbers do NOT include APY from the underlying asset.
*/

type Vault = {
    address: string;
    chain: {
        network: string;
    };
    state: {
        apy: number;
        netApyWithoutRewards: number;
        fee: number;
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
                    rewardApy: vault.state.apy * (1 - vault.state.fee) - vault.state.netApyWithoutRewards,
                    chain: mapMorphoNetworkToChain[vault.chain.network as keyof typeof mapMorphoNetworkToChain],
                },
            ]),
        );
    },
};
