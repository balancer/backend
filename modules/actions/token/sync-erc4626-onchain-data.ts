import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { ViemClient } from '../../sources/types';
import { fetchBufferBalances } from '../../sources/contracts/v3/fetch-buffer-balances';
import { fetchMaxValues } from '../../sources/contracts/v3/fetch-erc4626-max-values';
import { fetchUnwrapRates } from '../../sources/contracts/v3/fetch-unwrap-rates';
import _ from 'lodash';

/**
 * Syncs onchain data for ERC4626 tokens and stores them in the database
 */
export const syncErc4626OnchainData = async (vaultExplorerAddress: string, viemClient: ViemClient, chain: Chain) => {
    console.log(`[ERC4626 ${chain}] Starting ERC4626 data sync...`);

    // Get all ERC4626 tokens for the chain
    const erc4626Tokens = await prisma.prismaToken.findMany({
        where: {
            chain,
            types: {
                some: {
                    type: 'ERC4626',
                },
            },
            underlyingTokenAddress: {
                not: null,
            },
        },
    });

    const erc4626TokensMap = Object.fromEntries(erc4626Tokens.map((token) => [token.address, token]));

    if (erc4626Tokens.length === 0) {
        console.log(`[ERC4626 ${chain}] No ERC4626 tokens found`);
        return;
    }

    console.log(`[ERC4626 ${chain}] Found ${erc4626Tokens.length} ERC4626 tokens`);

    // Get all underlying tokens for the ERC4626 tokens
    const underlyingTokenAddresses = erc4626Tokens
        .map((token) => token.underlyingTokenAddress)
        .filter((address) => address !== null) as string[];

    const underlyingTokens = await prisma.prismaToken.findMany({
        where: {
            chain,
            address: {
                in: underlyingTokenAddresses,
            },
        },
    });

    // Create a map for quick lookup
    const underlyingTokenMap: { [address: string]: any } = {};
    underlyingTokens.forEach((token) => {
        underlyingTokenMap[token.address] = token;
    });

    try {
        const [maxValues, unwrapRates, bufferBalances] = await Promise.all([
            fetchMaxValues(chain, erc4626Tokens),
            fetchUnwrapRates(erc4626Tokens, underlyingTokenMap),
            fetchBufferBalances(erc4626Tokens, underlyingTokenMap, vaultExplorerAddress, viemClient),
        ]);

        // Merge onchain data into one object
        const onchainData = _.merge({}, maxValues, unwrapRates, bufferBalances);

        // Update database with the new buffer balances in a single transaction
        await prisma.$transaction(async (tx) => {
            const updatePromises = Object.entries(onchainData)
                .map(([tokenAddress, newData]) => {
                    // Check if it needs an update
                    const currentToken = erc4626TokensMap[tokenAddress];
                    const data = {
                        ...(newData.bufferBalanceUnderlying &&
                        currentToken.bufferBalanceUnderlying !== newData.bufferBalanceUnderlying
                            ? { bufferBalanceUnderlying: newData.bufferBalanceUnderlying }
                            : {}),
                        ...(newData.bufferBalanceWrapped &&
                        currentToken.bufferBalanceWrapped !== newData.bufferBalanceWrapped
                            ? { bufferBalanceWrapped: newData.bufferBalanceWrapped }
                            : {}),
                        ...(currentToken.maxDeposit !== newData.maxDeposit ? { maxDeposit: newData.maxDeposit } : {}),
                        ...(currentToken.maxWithdraw !== newData.maxWithdraw
                            ? { maxWithdraw: newData.maxWithdraw }
                            : {}),
                        ...(currentToken.unwrapRate !== newData.unwrapRate ? { unwrapRate: newData.unwrapRate } : {}),
                    };

                    if (Object.keys(data).length === 0) return;

                    return tx.prismaToken.update({
                        where: {
                            address_chain: {
                                address: tokenAddress,
                                chain: chain,
                            },
                        },
                        data,
                    });
                })
                .filter((op): op is NonNullable<typeof op> => !!op);

            await Promise.all(updatePromises);
        });

        console.log(`[ERC4626 ${chain}] Successfully updated ERC4626 data for ${erc4626Tokens.length} tokens`);
    } catch (error) {
        console.error(`[ERC4626 ${chain}] Error syncing ERC4626 data:`, error);
        throw error;
    }
};
