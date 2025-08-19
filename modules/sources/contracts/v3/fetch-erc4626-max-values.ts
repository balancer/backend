import { Chain, PrismaToken } from '@prisma/client';
import { Multicaller3Viem } from '../../../web3/multicaller-viem';
import MinimalErc4626Abi from '../abis/MinimalERC4626';
import { formatUnits } from 'viem';
import { AddressZero } from '@ethersproject/constants';
import config from '../../../../config';

/**
 * Fetches maxDeposit and maxWithdraw amounts for a list of ERC4626 tokens and returns them as strings
 * @param erc4626Tokens
 * @returns
 */
export const fetchMaxValues = async (
    chain: Chain,
    erc4626Tokens: PrismaToken[],
): Promise<{
    [id: string]: { maxDeposit: string; maxWithdraw: string };
}> => {
    if (erc4626Tokens.length === 0) {
        return {};
    }

    const caller = new Multicaller3Viem(chain, MinimalErc4626Abi);
    erc4626Tokens.forEach((token) => {
        caller.call(`${token.address}-maxDeposit`, token.address, 'maxDeposit', [AddressZero]);
        caller.call(`${token.address}-maxWithdraw`, token.address, 'maxWithdraw', [config[chain].balancer.v3]);
    });
    const results = await caller.execute<{ [id: string]: bigint }>();

    const addressDecimalMap = Object.fromEntries(erc4626Tokens.map((token) => [token.address, token.decimals]));

    const formattedResults: { [id: string]: { maxDeposit: string; maxWithdraw: string } } = {};

    // Convert the results to floats
    for (const key in results) {
        const tokenAddress = key.split('-')[0];
        const call = key.split('-')[1];
        const formattedValue = formatUnits(results[key], addressDecimalMap[tokenAddress]);
        if (!formattedResults[tokenAddress]) {
            formattedResults[tokenAddress] = { maxDeposit: '0', maxWithdraw: '0' };
        }
        if (call === 'maxDeposit') {
            formattedResults[tokenAddress].maxDeposit = formattedValue;
        } else if (call === 'maxWithdraw') {
            formattedResults[tokenAddress].maxWithdraw = formattedValue;
        }
    }

    return formattedResults;
};
