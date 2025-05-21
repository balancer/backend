import { Chain } from '@prisma/client';
import mainnet from './mainnet';
import arbitrum from './arbitrum';
import avalanche from './avalanche';
import base from './base';
import optimism from './optimism';
import polygon from './polygon';
import { AaveApiConfig, YbAprConfig } from '../handlers/types';

export default <Record<Chain, { ybAprConfig?: YbAprConfig, aaveApiConfig?: AaveApiConfig }>>{
    [Chain.MAINNET]: mainnet,
    [Chain.ARBITRUM]: arbitrum,
    [Chain.AVALANCHE]: avalanche,
    [Chain.BASE]: base,
    [Chain.FANTOM]: {},
    [Chain.FRAXTAL]: {},
    [Chain.GNOSIS]: {},
    [Chain.MODE]: {},
    [Chain.OPTIMISM]: optimism,
    [Chain.POLYGON]: polygon,
    [Chain.SEPOLIA]: {},
    [Chain.SONIC]: {},
    [Chain.ZKEVM]: {},
};
