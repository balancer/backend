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
                    netApy
                    netApyWithoutRewards
                }
            }
        }
    }
`;

type Vault = {
    address: string;
    chain: {
        network: string;
    };
    state: {
        netApy: number;
        netApyWithoutRewards: number;
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
                    netApy: vault.state.netApy,
                    netApyWithoutRewards: vault.state.netApyWithoutRewards,
                    rewardApy: vault.state.netApy - vault.state.netApyWithoutRewards,
                    chain: mapMorphoNetworkToChain[vault.chain.network as keyof typeof mapMorphoNetworkToChain],
                },
            ]),
        );
    },
};
