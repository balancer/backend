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
