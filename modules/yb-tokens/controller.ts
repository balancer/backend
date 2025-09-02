import { Chain } from '@prisma/client';
import config from '../../config';
import { YbTokensService } from './service';
import { YbAprConfig } from './types';

const fetchAndStoreAll = async () => {
    const configs = Object.fromEntries(
        Object.keys(config)
            .map((chain) => [chain, config[chain as keyof typeof config].aprHandlers.ybAprHandler])
            .filter((c): c is [Chain, YbAprConfig] => !!c[1]),
    );

    const chains = Object.keys(configs) as Chain[];

    const s = new YbTokensService();

    for (const chain of chains) {
        try {
            await s.fetchAndStoreYields(configs[chain], chain);
        } catch (e: any) {
            console.error(e);
        }
    }
};

export const YbTokensController = () => ({
    fetchAndStoreAll,
});
