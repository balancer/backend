import { Chain } from '@prisma/client';
import { OnchainPoolData, TokenPairData } from '../contracts';
import { formatEther, formatUnits, parseEther } from 'viem';

export type OnchainPoolUpdateData = ReturnType<typeof onchainPoolUpdate>;

export const onchainPoolUpdate = (
    onchainPoolData: OnchainPoolData,
    onChainTokenPairData: TokenPairData[],
    allTokens: { address: string; decimals: number }[],
    chain: Chain,
    id: string,
) => {
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));
    return {
        poolDynamicData: {
            poolId: id.toLowerCase(),
            chain: chain,
            isPaused: onchainPoolData.isPoolPaused,
            isInRecoveryMode: onchainPoolData.isPoolInRecoveryMode,
            totalShares: formatEther(onchainPoolData.totalSupply),
            blockNumber: 0,
            swapFee: String(onchainPoolData.swapFee ?? '0'),
            tokenPairsData: onChainTokenPairData,
        },
        poolTokenDynamicData: onchainPoolData.tokens.map((tokenData) => ({
            id: `${id}-${tokenData.address.toLowerCase()}`,
            chain: chain,
            balance: formatUnits(tokenData.balance, decimals[tokenData.address.toLowerCase()]),
            priceRate: String(tokenData.rate),
            blockNumber: 0,
        })),
    };
};
