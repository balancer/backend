import { Chain } from '@prisma/client';
import { OnchainPoolData } from '../contracts';
import { JoinedSubgraphPool } from '../types';
import { poolTransformer } from './pool-transformer';
import { formatUnits } from 'viem';
import { poolTokensDynamicDataTransformer, poolTokensTransformer } from './pool-tokens-transformer';

export type SubgraphPoolUpsertData = ReturnType<typeof subgraphPoolUpsert>;

export const subgraphPoolUpsert = (
    subgraphPoolData: JoinedSubgraphPool,
    onchainPoolData: OnchainPoolData,
    chain: Chain,
    blockNumber: number,
) => {
    const onchainTokensData = Object.fromEntries(onchainPoolData.tokens.map((token) => [token.address, token]));

    return {
        pool: poolTransformer(subgraphPoolData, chain),
        poolDynamicData: {
            id: subgraphPoolData.id,
            poolId: subgraphPoolData.id,
            chain: chain,
            totalShares: String(onchainPoolData.totalSupply),
            totalSharesNum: Number(formatUnits(onchainPoolData.totalSupply, 18)),
            blockNumber: Number(blockNumber),
            swapFee: String(onchainPoolData.swapFee ?? '0'),
            swapEnabled: true,
            totalLiquidity: 0,
        },
        poolToken: poolTokensTransformer(subgraphPoolData, chain),
        poolTokenDynamicData: poolTokensDynamicDataTransformer(subgraphPoolData, onchainTokensData, chain),
        poolExpandedTokens: subgraphPoolData.tokens.map(({ address, nestedPool }) => ({
            tokenAddress: address,
            poolId: subgraphPoolData.id,
            chain: chain,
            nestedPoolId: nestedPool?.id,
        })),
    };
};
