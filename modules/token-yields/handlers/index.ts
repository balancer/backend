import * as sources from './sources';
import { YbAprConfig, YbToken } from '../types';
import { Chain } from '@prisma/client';

const sourceToHandler = {
    aave: sources.aaveAprHandler,
    avalon: sources.avalonAprHandler,
    euler: sources.eulerAprHandler,
    teth: sources.treehouseAprHandler,
    sts: sources.stsAprHandler,
    hypurrfi: sources.hypurrFi,
    morphoVaultHyperevm: sources.morphoHyperevm,
    http: sources.httpAprHandler,
    contract: sources.contractAprHandler,
};

export class YbAprHandlers {
    private config: YbAprConfig;

    constructor(aprConfig: YbAprConfig, private chain: Chain) {
        const { fixedAprHandler, ...config } = aprConfig;
        this.config = config;
    }

    async fetchAprsFromAllHandlers(): Promise<YbToken[]> {
        let aprs: YbToken[] = [];

        const results = await Promise.allSettled([
            ...Object.entries(this.config).flatMap(([source, config]) => {
                if (Array.isArray(config)) {
                    return config.map((c) => this.callHandler(source as keyof typeof sourceToHandler, c));
                }

                return [this.callHandler(source as keyof typeof sourceToHandler, config)];
            }),
        ]);

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
