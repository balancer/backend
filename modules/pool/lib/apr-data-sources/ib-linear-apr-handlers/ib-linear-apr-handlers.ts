import * as sources from './sources';
import { IbAprConfig } from '../../../../network/apr-config-types';
import { Chain } from '@prisma/client';

const sourceToHandler = {
    aave: sources.AaveAprHandler,
    ankr: sources.AnkrAprHandler,
    beefy: sources.BeefyAprHandler,
    bloom: sources.BloomAprHandler,
    euler: sources.EulerAprHandler,
    gearbox: sources.GearboxAprHandler,
    idle: sources.IdleAprHandler,
    maker: sources.MakerAprHandler,
    ovix: sources.OvixAprHandler,
    reaper: sources.ReaperCryptAprHandler,
    tessera: sources.TesseraAprHandler,
    tetu: sources.TetuAprHandler,
    tranchess: sources.TranchessAprHandler,
    yearn: sources.YearnAprHandler,
    defaultHandlers: sources.DefaultAprHandler,
}

export class IbLinearAprHandlers {
    private handlers: AprHandler[] = [];
    fixedAprTokens?: { [tokenName: string]: { address: string; apr: number; group?: string; isIbYield?: boolean } };

    constructor(aprConfig: IbAprConfig, private chain?: Chain) {
        const { fixedAprHandler, ...config } = aprConfig;
        this.handlers = this.buildAprHandlers(config);
        this.fixedAprTokens = fixedAprHandler;
    }

    private buildAprHandlers(aprConfig: IbAprConfig) {
        const handlers: AprHandler[] = [];

        // Add handlers from global configuration
        for (const [source, config] of Object.entries(aprConfig)) {
            const Handler = sourceToHandler[source as keyof typeof sourceToHandler];

            // Handle nested configs
            if (source === 'aave' || source === 'defaultHandlers') {
                for (const nestedConfig of Object.values(config)) {
                    handlers.push(new Handler(nestedConfig as any));
                }
            } else {
                handlers.push(new Handler(config));
            }
        }

        // Add handlers from self-configured sources
        Object.values(sources as unknown as any[])
            .filter((source): source is { chains: Chain[], Handler: AprHandlerConstructor }  => 'chains' in source)
            .filter((source) => this.chain && source.chains.includes(this.chain))
            .forEach((source) => {
                handlers.push(new source.Handler());
        });

        return handlers;
    }

    async fetchAprsFromAllHandlers(): Promise<TokenApr[]> {
        let aprs: TokenApr[] = this.fixedAprTokens
            ? Object.values(this.fixedAprTokens).map(({ address, apr, isIbYield, group }) => ({
                apr,
                address,
                isIbYield: isIbYield ?? false,
                group
            }))
            : [];

        const results = await Promise.allSettled(this.handlers.map((handler) => handler.getAprs(this.chain)));

        for (const result of results) {
            if (result.status === 'fulfilled') {
                aprs = aprs.concat(
                    Object.entries(result.value).map(([address, { apr, isIbYield, group }]) => ({
                        apr,
                        address,
                        isIbYield,
                        group
                    })),
                );
            } else {
                console.error('Failed to fetch APRs from handler', result.reason);
            }
        }

        return aprs;
    }
}

interface AprHandlerConstructor {
    new (config?: any): AprHandler;
}

export interface AprHandler {
    group?: string;
    getAprs(chain?: Chain): Promise<{
        [tokenAddress: string]: {
            /** Defined as float, eg: 0.01 is 1% */
            apr: number;
            isIbYield: boolean
            group?: string;
        }
    }>;
}

export type TokenApr = {
    apr: number;
    address: string;
    isIbYield: boolean;
    group?: string;
};
