import { getViemClient } from '../viem-client';
import MinimalErc4626Abi from '../contracts/abis/MinimalERC4626';
import { Chain } from '@prisma/client';
import { VaultPoolFragment as VaultSubgraphPoolFragment } from '../subgraphs/balancer-v3-vault/generated/types';

interface CallData {
    asset: string;
    convertToAssets: BigInt;
    convertToShares: BigInt;
    previewDeposit: BigInt;
    previewMint: BigInt;
    previewRedeem: BigInt;
    previewWithdraw: BigInt;
}

export async function getErc4626Tokens(
    tokens: {
        address: string;
        decimals: number;
        name: string;
        symbol: string;
        chain: Chain;
        isErc4626: boolean;
        underlyingTokenAddress?: string;
    }[],
    chain: Chain,
): Promise<void> {
    const viemClient = getViemClient(chain);

    for (const token of tokens) {
        let response;
        try {
            response = await viemClient.multicall({
                contracts: [
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'asset',
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'convertToAssets',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'convertToShares',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'previewDeposit',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'previewMint',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'previewRedeem',
                        args: [1n],
                    },
                    {
                        address: token.address as `0x${string}`,
                        abi: MinimalErc4626Abi,
                        functionName: 'previewWithdraw',
                        args: [1n],
                    },
                ],
                allowFailure: false,
            });
        } catch (e) {
            token.isErc4626 = false;
            continue;
        }
        token.isErc4626 = true;
        token.underlyingTokenAddress = response[0].toLowerCase();
    }
}
