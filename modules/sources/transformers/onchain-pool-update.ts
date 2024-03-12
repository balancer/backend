import { Chain } from '@prisma/client';
import { OnchainPoolData } from '../contracts';

export type OnchainPoolUpdateData = ReturnType<typeof onchainPoolUpdate>;

export const onchainPoolUpdate = (onchainPoolData: OnchainPoolData, blockNumber: number, chain: Chain, id: string) => {
    return {
        poolDynamicData: {
            poolId: id.toLowerCase(),
            chain: chain,
            isPaused: onchainPoolData.isPoolPaused,
            isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
            totalShares: String(onchainPoolData.totalSupply),
            blockNumber: blockNumber,
            swapFee: String(onchainPoolData.swapFee ?? '0'),
        },
        poolTokenDynamicData: onchainPoolData.tokens.map((tokenData) => ({
            id: `${id}-${tokenData.address.toLowerCase()}`,
            chain: chain,
            balance: String(tokenData.balance),
            priceRate: String(tokenData.rate),
            blockNumber: blockNumber,
        })),
    };
};
