import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { fetchMaxValues } from '../../sources/contracts/v3/fetch-erc4626-max-values';

/**
 * Sync erc4626 maxDeposit and maxWithdraw values
 */
export const syncErc4626MaxValues = async (chain: Chain) => {
    const erc4626Tokens = await prisma.prismaToken.findMany({
        where: {
            chain,
            address: { not: '0x0000000000000000000000000000000000000000' },
            types: {
                some: {
                    type: 'ERC4626',
                },
            },
        },
    });

    const maxValues = await fetchMaxValues(chain, erc4626Tokens);

    const operations = erc4626Tokens
        .map((token) => {
            if (
                maxValues[token.address].maxDeposit === token.maxDeposit &&
                maxValues[token.address].maxWithdraw === token.maxWithdraw
            ) {
                return null;
            }

            return prisma.prismaToken.update({
                where: {
                    address_chain: {
                        address: token.address,
                        chain: chain,
                    },
                },
                data: {
                    maxDeposit: maxValues[token.address].maxDeposit,
                    maxWithdraw: maxValues[token.address].maxWithdraw,
                },
            });
        })
        .filter((op): op is NonNullable<typeof op> => !!op);

    await prisma.$transaction(operations);
};
