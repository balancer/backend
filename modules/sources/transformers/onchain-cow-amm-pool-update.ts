import { Chain } from '@prisma/client';
import { CowAmmOnchainData } from '../contracts';
import { formatEther, formatUnits } from 'viem';

export type OnchainCowAmmPoolUpdateData = ReturnType<typeof onchainCowAmmPoolUpdate>;

export const onchainCowAmmPoolUpdate = (
    onchainPoolData: CowAmmOnchainData,
    allTokens: { address: string; decimals: number }[],
    chain: Chain,
    id: string,
    blockNumber: bigint,
) => {
    const decimals = Object.fromEntries(allTokens.map((token) => [token.address, token.decimals]));

    return {
        poolDynamicData: {
            poolId: id.toLowerCase(),
            chain: chain,
            totalShares: formatEther(onchainPoolData.totalSupply),
            blockNumber: Number(blockNumber),
            swapFee: String(onchainPoolData.swapFee ?? '0'),
        },
        poolTokenDynamicData: onchainPoolData.tokens.map((tokenData) => ({
            id: `${id}-${tokenData.address.toLowerCase()}`,
            poolTokenId: `${id}-${tokenData.address.toLowerCase()}`,
            chain: chain,
            balance: formatUnits(tokenData.balance, decimals[tokenData.address.toLowerCase()]),
            blockNumber: Number(blockNumber),
            priceRate: '1',
        })),
    };
};
