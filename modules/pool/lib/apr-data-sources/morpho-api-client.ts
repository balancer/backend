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
                    netApy
                    rewards {
                        supplyApr
                        asset {
                            name
                            symbol
                            address
                        }
                    }
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
        apy: number;
        fee: number;
        netApy: number;
        rewards: {
            supplyApr: number;
            asset: {
                symbol: string;
                name: string;
                address: string;
            };
        }[];
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
    rewardTokens: async () => {
        const {
            vaults: { items },
        } = await request<BlueApiResponse>(url, query);

        // Map reward tokens to vault addresses
        return Object.fromEntries(
            items.map((vault: Vault) => [
                vault.address.toLowerCase(),
                vault.state.rewards.map((reward) => ({
                    name: reward.asset.name,
                    symbol: reward.asset.symbol,
                    address: reward.asset.address.toLowerCase(),
                    apr: reward.supplyApr,
                    chain: mapMorphoNetworkToChain[vault.chain.network as keyof typeof mapMorphoNetworkToChain],
                })),
            ]),
        );
    },
    morphoApr: async () => {
        const query = gql`
            {
                mainnet: vault(id: "560b57bd-0e46-425f-9549-f3e38be0e1e6") {
                    state {
                        netApyWithoutRewards
                        netApy
                    }
                }
                base: vault(id: "5ebe85c0-0049-47bd-b6ab-ec913189191a") {
                    state {
                        netApyWithoutRewards
                        netApy
                    }
                }
            }
        `;

        type Response = {
            mainnet: {
                state: {
                    netApyWithoutRewards: number;
                    netApy: number;
                };
            };
            base: {
                state: {
                    netApyWithoutRewards: number;
                    netApy: number;
                };
            };
        };

        const r = await request<Response>(url, query);
        const mainnetApr = r?.mainnet?.state?.netApy - r?.mainnet?.state?.netApyWithoutRewards;
        const baseApr = r?.base?.state?.netApy - r?.base?.state?.netApyWithoutRewards;

        return { MAINNET: mainnetApr, BASE: baseApr };
    },
};
