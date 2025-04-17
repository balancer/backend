import { Chain, PrismaPoolType } from '@prisma/client';
import { PoolType } from '../subgraphs/balancer-v3-pools/generated/types';
import { StableData } from '../../pool/subgraph-mapper';
import { gyro, stable, quantAmmWeighted, lbPool } from '../../pool/pool-data';
import { V3JoinedSubgraphPool } from '../subgraphs';
import { parseEther } from 'viem';
import { PoolUpsertData } from '../../../prisma/prisma-types';
import { hookTransformer } from './hook-transformer';
import _ from 'lodash';
import { reclamm } from '../../pool/pool-data/reclamm';

// Subgraph to DB format transformation
export const poolUpsertTransformerV3 = (
    poolData: V3JoinedSubgraphPool,
    chain: Chain,
    blockNumber: number,
): PoolUpsertData => {
    let type: PrismaPoolType;
    let typeData: ReturnType<(typeof typeDataMapper)[keyof typeof typeDataMapper]> | {} = {};

    // expand the nested tokens
    const allTokens = _.flattenDeep(
        poolData.tokens.map((token) => [
            token,
            ...(token.nestedPool?.tokens || []).map((nestedToken) => ({
                ...nestedToken,
                nestedPoolId: token.nestedPool?.id || null,
            })),
        ]),
    );

    switch (poolData.factory.type) {
        case PoolType.Weighted:
            type = PrismaPoolType.WEIGHTED;
            break;
        case PoolType.Stable:
            type = PrismaPoolType.STABLE;
            typeData = {
                amp: poolData.stableParams!.amp,
            } as StableData;
            break;
        case PoolType.StableSurge:
            type = PrismaPoolType.STABLE;
            if (poolData.stableSurgeParams) {
                typeData = {
                    amp: poolData.stableSurgeParams!.amp,
                } as StableData;
            }
            break;
        case PoolType.Gyro2:
            type = PrismaPoolType.GYRO;
            typeData = {
                ...poolData.gyro2Params,
            };
            break;
        case PoolType.GyroE:
            type = PrismaPoolType.GYROE;
            typeData = {
                ...poolData.gyroEParams,
            };
            break;
        case PoolType.QuantAmmWeighted:
            type = PrismaPoolType.QUANT_AMM_WEIGHTED;
            typeData = quantAmmWeighted(poolData);
            break;
        case PoolType.Lbp:
            type = PrismaPoolType.LIQUIDITY_BOOTSTRAPPING;
            typeData = lbPool(poolData);
            break;
        case PoolType.ReClamm:
            type = PrismaPoolType.RECLAMM;
            typeData = reclamm(poolData);
            break;
        default:
            type = PrismaPoolType.UNKNOWN;
    }

    return {
        pool: {
            id: poolData.id.toLowerCase(),
            chain: chain,
            protocolVersion: 3,
            address: poolData.id.toLowerCase(),
            decimals: 18,
            symbol: poolData.symbol,
            name: poolData.name,
            swapFeeManager: poolData.swapFeeManager,
            pauseManager: poolData.pauseManager,
            poolCreator: poolData.poolCreator,
            factory: poolData.factory.id.toLowerCase(),
            type: type,
            typeData: typeData,
            version: poolData.factory.version,
            createTime: Number(poolData.blockTimestamp),
            liquidityManagement: poolData.liquidityManagement,
            hook: hookTransformer(poolData, chain),
        },
        tokens: [
            ...poolData.tokens.map((token) => ({
                address: token.address,
                decimals: token.decimals,
                symbol: token.symbol,
                name: token.name,
                chain,
            })),
            {
                address: poolData.id,
                decimals: 18,
                symbol: poolData.symbol,
                name: poolData.name,
                chain,
            },
        ],
        poolDynamicData: {
            id: poolData.id,
            swapFee: String(poolData.swapFee),
            totalShares: String(parseEther(poolData.totalShares)),
            totalSharesNum: Number(poolData.totalShares),
            isPaused: poolData.isPaused,
            isInRecoveryMode: poolData.isInRecoveryMode,
            blockNumber,
        },
        poolToken: poolData.tokens.map((token, i) => ({
            id: `${poolData.id}-${token.address}`.toLowerCase(),
            poolId: poolData.id.toLowerCase(),
            chain: chain,
            address: token.address.toLowerCase(),
            index: token.index,
            nestedPoolId: token.nestedPool?.id.toLowerCase() ?? null,
            priceRateProvider: poolData.rateProviders![i].address.toLowerCase(),
            exemptFromProtocolYieldFee: !token.paysYieldFees,
            scalingFactor: token.scalingFactor,
            balance: token.balance,
            weight: poolData.weightedParams ? poolData.weightedParams.weights[token.index] ?? null : null,
        })),
        poolExpandedTokens: allTokens.map((token) => ({
            poolId: poolData.id.toLowerCase(),
            chain,
            tokenAddress: token.address.toLowerCase(),
            nestedPoolId: token.nestedPool?.id.toLowerCase() || null,
        })),
    };
};

const typeDataMapper = {
    GYRO: gyro,
    GYRO3: gyro,
    GYROE: gyro,
    STABLE: stable,
    QUANT_AMM_WEIGHTED: quantAmmWeighted,
};
