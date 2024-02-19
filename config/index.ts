import { Chain } from '@prisma/client';
import { NetworkData } from '@modules/network/network-config-types';
import sepolia from './sepolia';

export default {
    [Chain.ARBITRUM]: {} as NetworkData,
    [Chain.AVALANCHE]: {} as NetworkData,
    [Chain.BASE]: {} as NetworkData,
    [Chain.FANTOM]: {} as NetworkData,
    [Chain.GNOSIS]: {} as NetworkData,
    [Chain.MAINNET]: {} as NetworkData,
    [Chain.OPTIMISM]: {} as NetworkData,
    [Chain.POLYGON]: {} as NetworkData,
    [Chain.SEPOLIA]: sepolia,
    [Chain.ZKEVM]: {} as NetworkData,
};
