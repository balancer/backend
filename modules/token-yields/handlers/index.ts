import * as sources from './sources';
import { TokenYieldConfig, YieldToken } from '../types';
import { Chain } from '@prisma/client';

const sourceToHandler = {
    aave: sources.aaveTokenYieldHandler,
    avalon: sources.avalonYieldHandler,
    euler: sources.eulerYieldHandler,
    teth: sources.treehouseYieldHandler,
    sts: sources.stsYieldHandler,
    hypurrfi: sources.hypurrFiYieldhandler,
    morphoVaultHyperevm: sources.morphoHyperevmYieldHandler,
    http: sources.httpTokenYieldHandler,
    contract: sources.contractTokenYieldHandler,
};

export class TokenYieldAprHandlers {
    private config: TokenYieldConfig;

    constructor(aprConfig: TokenYieldConfig, private chain: Chain) {
        const { ...config } = aprConfig;
        this.config = config;
    }

    async fetchAprsFromAllHandlers(): Promise<YieldToken[]> {
        let aprs: YieldToken[] = [];

        const results = await Promise.allSettled([
            ...Object.entries(this.config).flatMap(([source, config]) => {
                if (Array.isArray(config)) {
                    return config.map((c) => this.callHandler(source as keyof typeof sourceToHandler, c));
                }

                return [this.callHandler(source as keyof typeof sourceToHandler, config)];
            }),
        ]);

        const allSources = Object.keys(sourceToHandler) as (keyof typeof sourceToHandler)[];

        const failedReasons: string[] = [];

        for (const result of results) {
            if (result.status === 'fulfilled' && result.value !== null) {
                aprs.push(...result.value.map((r) => ({ ...r, success: true })));
            } else if (result.status === 'rejected') {
                failedReasons.push(String(result.reason));
            }
        }

        if (failedReasons.length > 0) {
            console.error(`Failed to fetch APRs from some token yield handlers: ${failedReasons.join(', ')}`);
        }

        const successfulSources = allSources.filter((source) => aprs.some((r) => r.source === source));
        const failedSources = allSources.filter((source) => !successfulSources.includes(source));

        for (const failedSource of failedSources) {
            // need to make sure we dont remove APRs for failed sources but also dont update them. Its ok to have a dummy address here, we only match on the source name
            aprs.push({
                address: '0x0000000000000000000000000000000000000000',
                chain: this.chain,
                source: failedSource,
                apr: 0,
                success: false,
            });
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
