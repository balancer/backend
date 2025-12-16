import * as sources from './sources';
import { TokenYieldConfig, YieldToken } from '../types';
import { Chain } from '@prisma/client';

const sourceToHandler = {
    aave: sources.aaveOnchainHandler,
    avalon: sources.avalonYieldHandler,
    euler: sources.eulerYieldHandler,
    teth: sources.treehouseYieldHandler,
    sts: sources.stsYieldHandler,
    hypurrfi: sources.hypurrFiYieldhandler,
    morphoVaultHyperevm: sources.morphoHyperevmYieldHandler,
    http: sources.httpTokenYieldHandler,
    contract: sources.contractTokenYieldHandler,
    rateProvider: sources.rateProviderHandler,
    loops: sources.loopsYieldHandler,
};

export class TokenYieldAprHandlers {
    private config: TokenYieldConfig;

    constructor(aprConfig: TokenYieldConfig, private chain: Chain) {
        const { ...config } = aprConfig;
        this.config = config;
    }

    async fetchAprsFromAllHandlers(): Promise<YieldToken[]> {
        let aprs: YieldToken[] = [];

        const results = await Promise.allSettled(
            Object.entries(this.config).flatMap(([source, config]) => {
                if (Array.isArray(config)) {
                    return config.map((c) => this.callHandler(source as keyof typeof sourceToHandler, c));
                }

                return [this.callHandler(source as keyof typeof sourceToHandler, config)];
            }),
        );

        const failedReasons: string[] = [];

        for (const result of results) {
            if (result.status === 'fulfilled' && result.value !== null) {
                aprs = aprs.concat(result.value);
            } else if (result.status === 'rejected') {
                failedReasons.push(String(result.reason));
            }
        }

        if (failedReasons.length > 0) {
            console.error(`Failed to fetch APRs from some YB handlers: ${failedReasons.join(', ')}`);
        }

        return aprs;
    }

    private callHandler = async (source: keyof typeof sourceToHandler, config: any) => {
        const handler = sourceToHandler[source as keyof typeof sourceToHandler];

        if (!handler) {
            throw `no handler ${source}`;
        }

        const value = await handler(config);
        return value.map((item) => ({ source, chain: this.chain, ...item }));
    };
}
