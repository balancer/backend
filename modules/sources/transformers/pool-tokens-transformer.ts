import { PoolFragment } from '../../subgraphs/balancer-v3-vault/generated/types';

export const poolTokensTransformer = (subgraphPool: PoolFragment) => {
    const tokens = subgraphPool.tokens ?? [];
    return tokens.map((token, i) => ({
        id: `${subgraphPool.id}-${token.address}`.toLowerCase(),
        address: token.address.toLowerCase(),
        index: token.index,
        nestedPoolId: null,
        priceRateProvider: subgraphPool.rateProviders![i].address.toLowerCase(),
        exemptFromProtocolYieldFee: token.totalProtocolYieldFee === '0' ? true : false,
    }));
};
