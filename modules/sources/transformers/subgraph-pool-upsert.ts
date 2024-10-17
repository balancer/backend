import { Chain, Prisma } from '@prisma/client';
import { OnchainDataCowAmm, OnchainDataV3 } from '../contracts';
import { V3JoinedSubgraphPool } from '../types';
import { poolV3Transformer, hookTransformer, poolCowTransformer } from './';
import { formatEther, formatUnits } from 'viem';
import {
    poolCowTokensTransformer,
    poolTokensDynamicDataTransformer,
    poolV3TokensTransformer,
} from './pool-tokens-transformer';
import { CowAmmPoolFragment } from '../subgraphs/cow-amm/generated/types';

export type SubgraphPoolUpsertData = {
    pool: Prisma.PrismaPoolCreateInput;
    hook?: Prisma.HookCreateInput;
    poolDynamicData: Prisma.PrismaPoolDynamicDataCreateInput;
    poolToken: Prisma.PrismaPoolTokenCreateManyInput[];
    poolTokenDynamicData: Prisma.PrismaPoolTokenDynamicDataCreateManyInput[];
    poolExpandedTokens: Prisma.PrismaPoolExpandedTokensCreateManyInput[];
};

export const subgraphPoolV3Upsert = (
    subgraphPoolData: V3JoinedSubgraphPool,
    onchainPoolData: OnchainDataV3,
    chain: Chain,
    blockNumber?: bigint,
): SubgraphPoolUpsertData | null => {
    // Handle the case when the pool doesn't have tokens
    if (!subgraphPoolData.tokens || !subgraphPoolData.tokens.length) {
        return null;
    }

    const onchainTokensData = Object.fromEntries(
        onchainPoolData.tokens.map((token) => [token.address.toLowerCase(), token]),
    );

    return {
        pool: poolV3Transformer(subgraphPoolData, chain),
        hook: hookTransformer(subgraphPoolData, chain),
        poolDynamicData: {
            id: subgraphPoolData.id,
            pool: {
                connect: {
                    id_chain: {
                        id: subgraphPoolData.id,
                        chain: chain,
                    },
                },
            },
            totalShares: formatEther(onchainPoolData.totalSupply),
            totalSharesNum: Number(formatUnits(onchainPoolData.totalSupply, 18)),
            blockNumber: Number(blockNumber || 0),
            swapFee: formatEther(onchainPoolData.swapFee),
            aggregateSwapFee: formatEther(onchainPoolData.aggregateSwapFee || 0n),
            aggregateYieldFee: formatEther(onchainPoolData.aggregateYieldFee || 0n),
            swapEnabled: true,
            holdersCount: Number(subgraphPoolData.holdersCount),
            totalLiquidity: 0,
            isPaused: onchainPoolData.isPoolPaused,
            isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
        },
        poolToken: poolV3TokensTransformer(subgraphPoolData, chain),
        poolTokenDynamicData: poolTokensDynamicDataTransformer(subgraphPoolData, onchainTokensData, chain),
        poolExpandedTokens: subgraphPoolData.tokens.map(({ address, nestedPool }) => ({
            tokenAddress: address,
            poolId: subgraphPoolData.id,
            chain: chain,
            nestedPoolId: nestedPool?.id,
        })),
    };
};

export const subgraphPoolCowUpsert = (
    subgraphPoolData: CowAmmPoolFragment,
    onchainPoolData: OnchainDataCowAmm,
    chain: Chain,
    blockNumber?: bigint,
): SubgraphPoolUpsertData | null => {
    // Handle the case when the pool doesn't have tokens
    if (!subgraphPoolData.tokens || !subgraphPoolData.tokens.length) {
        return null;
    }

    const tokensData = onchainPoolData.tokens.map((token) => ({
        ...token,
        rateProvider: '',
        rate: 1n,
        paysYieldFees: false,
        isErc4626: false,
        scalingFactor: undefined,
    }));

    const onchainTokensData = Object.fromEntries(tokensData.map((token) => [token.address.toLowerCase(), token]));

    return {
        pool: poolCowTransformer(subgraphPoolData, chain),
        hook: undefined,
        poolDynamicData: {
            id: subgraphPoolData.id,
            pool: {
                connect: {
                    id_chain: {
                        id: subgraphPoolData.id,
                        chain: chain,
                    },
                },
            },
            totalShares: formatEther(onchainPoolData.totalSupply),
            totalSharesNum: Number(formatUnits(onchainPoolData.totalSupply, 18)),
            blockNumber: Number(blockNumber || 0),
            swapFee: formatEther(onchainPoolData.swapFee),
            swapEnabled: true,
            holdersCount: Number(subgraphPoolData.holdersCount),
            totalLiquidity: 0,
            isPaused: false,
            isInRecoveryMode: false,
        },
        poolToken: poolCowTokensTransformer(subgraphPoolData, chain),
        poolTokenDynamicData: poolTokensDynamicDataTransformer(subgraphPoolData, onchainTokensData, chain),
        poolExpandedTokens: subgraphPoolData.tokens.map(({ address }) => ({
            tokenAddress: address,
            poolId: subgraphPoolData.id,
            chain: chain,
            nestedPoolId: undefined,
        })),
    };
};
