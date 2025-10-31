import { Chain } from '@prisma/client';
import { env } from '../../apps/env';

export const chainIdToChain: { [id: string]: Chain } = {
    '1': Chain.MAINNET,
    '10': Chain.OPTIMISM,
    '100': Chain.GNOSIS,
    '137': Chain.POLYGON,
    '250': Chain.FANTOM,
    '1101': Chain.ZKEVM,
    '8453': Chain.BASE,
    '42161': Chain.ARBITRUM,
    '43114': Chain.AVALANCHE,
    '252': Chain.FRAXTAL,
    '34443': Chain.MODE,
    '146': Chain.SONIC,
    '999': Chain.HYPEREVM,
    '9745': Chain.PLASMA,
    '196': Chain.XLAYER,
    ...(env.DEPLOYMENT_ENV !== 'production' ? { '11155111': Chain.SEPOLIA } : {}),
};

export const chainToChainId: { [chain: string]: string } = {
    MAINNET: '1',
    OPTIMISM: '10',
    GNOSIS: '100',
    POLYGON: '137',
    FANTOM: '250',
    ZKEVM: '1101',
    BASE: '8453',
    ARBITRUM: '42161',
    AVALANCHE: '43114',
    FRAXTAL: '252',
    MODE: '34443',
    SONIC: '146',
    HYPEREVM: '999',
    PLASMA: '9745',
    XLAYER: '196',
    ...(env.DEPLOYMENT_ENV !== 'production' ? { SEPOLIA: '11155111' } : {}),
};
