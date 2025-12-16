import { Chain } from '@prisma/client';
import config from '../../../config';

export const githubChainToChain: { [chain: string]: Chain } = {
    ethereum: Chain.MAINNET,
    ...Object.fromEntries(Object.keys(config).map((chain) => [chain.toLowerCase(), chain])),
};
