import { ViemClient } from '../viem-client';
import MinimalErc4626Abi from './abis/MinimalERC4626';
import { fetchErc20Headers } from '.';

export async function fetchErc4626AndUnderlyingTokenData(
    tokens: { address: string; decimals: number; name: string; symbol: string }[],
    viemClient: ViemClient,
): Promise<
    {
        address: string;
        decimals: number;
        name: string;
        symbol: string;
        isErc4626: boolean;
    }[]
> {
    const tokenData: {
        [id: string]: {
            address: string;
            decimals: number;
            name: string;
            symbol: string;
            isErc4626: boolean;
        };
    } = {};

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
            continue;
        }
        const underlyingTokenAddress = response[0].toLowerCase();

        tokenData[token.address] = {
            address: token.address,
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol,
            isErc4626: true,
        };

        if (!tokenData[underlyingTokenAddress]) {
            const underlyingTokenDetail = await fetchErc20Headers(
                [underlyingTokenAddress as `0x${string}`],
                viemClient,
            );

            tokenData[underlyingTokenAddress] = {
                address: underlyingTokenAddress,
                decimals: underlyingTokenDetail[underlyingTokenAddress].decimals,
                name: underlyingTokenDetail[underlyingTokenAddress].name,
                symbol: underlyingTokenDetail[underlyingTokenAddress].symbol,
                isErc4626: false,
            };
        }
    }

    return [...Object.values(tokenData)];
}
