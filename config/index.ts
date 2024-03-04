import { Chain } from '@prisma/client';
import sepoliaConfig from './sepolia';
import { NetworkData } from '../modules/network/network-config-types';

export default {
    [Chain.ARBITRUM]: {} as NetworkData,
    [Chain.AVALANCHE]: {} as NetworkData,
    [Chain.BASE]: {} as NetworkData,
    [Chain.FANTOM]: {} as NetworkData,
    [Chain.GNOSIS]: {} as NetworkData,
    [Chain.MAINNET]: {} as NetworkData,
    [Chain.OPTIMISM]: {} as NetworkData,
    [Chain.POLYGON]: {} as NetworkData,
    [Chain.SEPOLIA]: sepoliaConfig,
    [Chain.ZKEVM]: {} as NetworkData,
};
