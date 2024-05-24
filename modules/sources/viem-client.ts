import { createPublicClient, http } from 'viem';
import {
    arbitrum,
    avalanche,
    base,
    fantom,
    gnosis,
    mainnet,
    optimism,
    polygon,
    polygonZkEvm,
    sepolia,
    fraxtal,
    mode,
} from 'viem/chains';
import { Chain } from '@prisma/client';
import config from '../../config';

export type ViemClient = ReturnType<typeof getViemClient>;

const chain2ViemChain = {
    [Chain.MAINNET]: mainnet,
    [Chain.SEPOLIA]: sepolia,
    [Chain.ARBITRUM]: arbitrum,
    [Chain.AVALANCHE]: avalanche,
    [Chain.BASE]: base,
    [Chain.FANTOM]: fantom,
    [Chain.GNOSIS]: gnosis,
    [Chain.OPTIMISM]: optimism,
    [Chain.POLYGON]: polygon,
    [Chain.ZKEVM]: polygonZkEvm,
    [Chain.FRAXTAL]: fraxtal,
    [Chain.MODE]: mode,
};

export const getViemClient = (chain: Chain) => {
    return createPublicClient({
        chain: chain2ViemChain[chain],
        transport: http(config[chain]?.rpcUrl),
    });
};
