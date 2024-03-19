import { Chain } from '@prisma/client';
import { OnchainPoolData, TokenPairData } from '../contracts';

export type OnchainPoolUpdateData = ReturnType<typeof onchainPoolUpdate>;

export const onchainPoolUpdate = (
    onchainPoolData: OnchainPoolData,
    onChainTokenPairData: TokenPairData[],
    chain: Chain,
    id: string,
) => {
    return {
        poolDynamicData: {
            poolId: id.toLowerCase(),
            chain: chain,
            isPaused: onchainPoolData.isPoolPaused,
            isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
            totalShares: String(onchainPoolData.totalSupply),
            blockNumber: 0,
            swapFee: String(onchainPoolData.swapFee ?? '0'),
            tokenPairsData: onChainTokenPairData,
        },
        poolTokenDynamicData: onchainPoolData.tokens.map((tokenData) => ({
            id: `${id}-${tokenData.address.toLowerCase()}`,
            chain: chain,
            balance: String(tokenData.balance),
            priceRate: String(tokenData.rate),
            blockNumber: 0,
        })),
    };
};
