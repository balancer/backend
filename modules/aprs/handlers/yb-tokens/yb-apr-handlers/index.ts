import * as sources from './sources';
import { YbAprConfig, YbAprHandler, TokenApr } from '../types';
import { Chain } from '@prisma/client';
export type { YbAprHandler as AprHandler, TokenApr };

const sourceToHandler = {
    aave: sources.aaveAprHandler,
    avalon: sources.avalonAprHandler,
    euler: sources.eulerAprHandler,
    maker: sources.makerAprHandler,
    dforce: sources.dForce,
    teth: sources.treehouseAprHandler,
    sts: sources.stsAprHandler,
    silo: sources.siloAprHandler,
    susds: sources.sUSDSAprHandler,
    hypurrfi: sources.hypurrFi,
    morphoVaultHyperevm: sources.morphoHyperevm,
    http: sources.httpAprHandler,
};

const chainSources = [sources.AaveAuto, sources.MakerGnosis];

export class YbAprHandlers {
    private config: YbAprConfig;
    fixedAprTokens?: { [tokenName: string]: { address: string; apr: number } };

    constructor(
        aprConfig: YbAprConfig,
        private chain?: Chain,
    ) {
        const { fixedAprHandler, ...config } = aprConfig;
        this.config = config;
        this.fixedAprTokens = fixedAprHandler;
    }

    async fetchAprsFromAllHandlers(): Promise<TokenApr[]> {
        let aprs: TokenApr[] = this.fixedAprTokens
            ? Object.values(this.fixedAprTokens).map(({ address, apr }) => ({
                  apr,
                  address,
              }))
            : [];

        const results = await Promise.allSettled([
            ...Object.entries(this.config).flatMap(([source, config]) => {
                if (Array.isArray(config)) {
                    return config.map((c) => this.callHandler(source as keyof typeof sourceToHandler, c));
                }

                return [this.callHandler(source as keyof typeof sourceToHandler, config)];
            }),

            // Add handlers from chain configured sources
            ...chainSources
                .filter((source) => this.chain && source.chains.includes(this.chain))
                .map((source) => source.handler(this.chain)),
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
        return value;
    };
}
