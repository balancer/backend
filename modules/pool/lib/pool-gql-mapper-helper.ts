import { Chain } from '@prisma/client';
import {
    GqlPoolTokenDetail,
    GqlNestedPool,
    GqlHook,
    LiquidityManagement,
} from '../../../apps/api/gql/generated-schema';
import {
    PrismaPoolTokenWithExpandedNesting,
    PrismaNestedPoolWithSingleLayerNesting,
    HookData,
} from '../../../prisma/prisma-types';
import { floatToExactString } from '../../common/numbers';
import { chainToChainId } from '../../network/chain-id-to-chain';
import { StableData } from '../subgraph-mapper';
import { prisma } from '../../../prisma/prisma-client';
import { tokenService } from '../../token/token.service';

export function mapPoolToken(poolToken: PrismaPoolTokenWithExpandedNesting, nestedPercentage = 1): GqlPoolTokenDetail {
    const { nestedPool } = poolToken;

    const hasNestedPool = nestedPool !== null && nestedPool.id !== poolToken.poolId;

    return {
        id: `${poolToken.poolId}-${poolToken.token.address}`,
        ...poolToken.token,
        index: poolToken.index,
        balance: floatToExactString(parseFloat(poolToken.balance || '0') * nestedPercentage),
        balanceUSD: floatToExactString((poolToken.balanceUSD || 0) * nestedPercentage),
        priceRate: poolToken.priceRate || '1.0',
        priceRateProvider: poolToken.priceRateProvider,
        weight: poolToken.weight,
        hasNestedPool: hasNestedPool,
        nestedPool: hasNestedPool ? mapNestedPool(nestedPool, poolToken.balance || '0') : undefined,
        isAllowed: poolToken.token.types.some(
            (type) => type.type === 'WHITE_LISTED' || type.type === 'PHANTOM_BPT' || type.type === 'BPT',
        ),
        isErc4626: poolToken.token.types.some((type) => type.type === 'ERC4626'),
        isExemptFromProtocolYieldFee: poolToken.exemptFromProtocolYieldFee,
        scalingFactor: poolToken.scalingFactor,
        tradable: !poolToken.token.types.find((type) => type.type === 'PHANTOM_BPT' || type.type === 'BPT'),
        chain: poolToken.chain,
        chainId: Number(chainToChainId[poolToken.chain]),
    };
}

function mapNestedPool(nestedPool: PrismaNestedPoolWithSingleLayerNesting, tokenBalance: string): GqlNestedPool {
    const totalShares = parseFloat(nestedPool.dynamicData?.totalShares || '0');
    const percentOfSupplyNested = totalShares > 0 ? parseFloat(tokenBalance) / totalShares : 0;
    const totalLiquidity = nestedPool.dynamicData?.totalLiquidity || 0;

    const hook = (nestedPool.hook as HookData)?.address ? (nestedPool.hook as HookData) : null;

    return {
        ...nestedPool,
        owner: nestedPool.swapFeeManager, // Keep for backwards compatibility
        liquidityManagement: (nestedPool.liquidityManagement as LiquidityManagement) || undefined,
        totalLiquidity: `${totalLiquidity}`,
        totalShares: `${totalShares}`,
        nestedShares: `${totalShares * percentOfSupplyNested}`,
        nestedLiquidity: `${totalLiquidity * percentOfSupplyNested}`,
        nestedPercentage: `${percentOfSupplyNested}`,
        tokens: nestedPool.tokens.map((token) =>
            mapPoolToken(
                {
                    ...token,
                    nestedPool: null,
                },
                percentOfSupplyNested,
            ),
        ),
        swapFee: nestedPool.dynamicData?.swapFee || '0',
        bptPriceRate: (nestedPool.typeData as StableData).bptPriceRate || '1.0',
        hook: hook as GqlHook,
    };
}

export async function enrichWithErc4626Data(poolTokens: GqlPoolTokenDetail[], chain: Chain) {
    for (const token of poolTokens) {
        if (token.isErc4626) {
            const prismaToken = await prisma.prismaToken.findUnique({
                where: { address_chain: { address: token.address, chain: chain } },
            });
            if (prismaToken?.underlyingTokenAddress) {
                const underlyingTokenDefinition = await tokenService.getTokenDefinition(
                    prismaToken.underlyingTokenAddress,
                    chain,
                );
                token.underlyingToken = underlyingTokenDefinition;
            }

            const erc4626ReviewData = await prisma.prismaErc4626ReviewData.findUnique({
                where: {
                    chain_erc4626Address: {
                        chain: chain,
                        erc4626Address: token.address,
                    },
                },
            });
            if (erc4626ReviewData) {
                token.erc4626ReviewData = {
                    ...erc4626ReviewData,
                    warnings: erc4626ReviewData.warnings?.split(',') || [],
                };
                token.useUnderlyingForAddRemove = erc4626ReviewData.useUnderlyingForAddRemove;
                token.useWrappedForAddRemove = erc4626ReviewData.useUnderlyingForAddRemove;
                token.canUseBufferForSwaps = erc4626ReviewData.canUseBufferForSwaps;
            } else {
                token.useUnderlyingForAddRemove = false;
                token.useWrappedForAddRemove = true;
                token.canUseBufferForSwaps = false;
            }
        }

        if (token.hasNestedPool) {
            for (const nestedToken of token.nestedPool!.tokens) {
                if (nestedToken.isErc4626) {
                    const prismaToken = await prisma.prismaToken.findUnique({
                        where: { address_chain: { address: nestedToken.address, chain: chain } },
                    });
                    if (prismaToken?.underlyingTokenAddress) {
                        const tokenDefinition = await tokenService.getTokenDefinition(
                            prismaToken.underlyingTokenAddress,
                            chain,
                        );
                        nestedToken.underlyingToken = tokenDefinition;
                    }

                    const erc4626ReviewData = await prisma.prismaErc4626ReviewData.findUnique({
                        where: {
                            chain_erc4626Address: {
                                chain: chain,
                                erc4626Address: nestedToken.address,
                            },
                        },
                    });
                    if (erc4626ReviewData) {
                        nestedToken.erc4626ReviewData = {
                            ...erc4626ReviewData,
                            warnings: erc4626ReviewData.warnings?.split(',') || [],
                        };
                        nestedToken.useUnderlyingForAddRemove = erc4626ReviewData.useUnderlyingForAddRemove;
                        nestedToken.useWrappedForAddRemove = erc4626ReviewData.useUnderlyingForAddRemove;
                        nestedToken.canUseBufferForSwaps = erc4626ReviewData.canUseBufferForSwaps;
                    } else {
                        nestedToken.useUnderlyingForAddRemove = false;
                        nestedToken.useWrappedForAddRemove = true;
                        nestedToken.canUseBufferForSwaps = false;
                    }
                }
            }
        }
    }
}
