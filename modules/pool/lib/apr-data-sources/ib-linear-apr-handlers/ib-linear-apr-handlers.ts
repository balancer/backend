import { AaveAprHandler } from './sources/aave-apr-handler';
import { AnkrAprHandler } from './sources/ankr-apr-handler';
import { DefaultAprHandler } from './sources/default-apr-handler';
import { EulerAprHandler } from './sources/euler-apr-handler';
import { GearboxAprHandler } from './sources/gearbox-apr-handler';
import { IdleAprHandler } from './sources/idle-apr-handler';
import { OvixAprHandler } from './sources/ovix-apr-handler';
import { TesseraAprHandler } from './sources/tessera-apr-handler';
import { TetuAprHandler } from './sources/tetu-apr-handler';
import { TranchessAprHandler } from './sources/tranchess-apr-handler';
import { YearnAprHandler } from './sources/yearn-apr-handler';
import { ReaperCryptAprHandler } from './sources/reaper-crypt-apr-handler';
import { BeefyAprHandler } from './sources/beefy-apr-handler';
import { IbAprConfig } from '../../../../network/apr-config-types';
import { MakerAprHandler } from './sources/maker-apr-handler';
import { BloomAprHandler } from './sources/bloom-apr-handler';

export class IbLinearAprHandlers {
    private handlers: AprHandler[] = [];
    fixedAprTokens?: { [tokenName: string]: { address: string; apr: number; group?: string; isIbYield?: boolean } };

    constructor(aprConfig: IbAprConfig) {
        this.handlers = this.buildAprHandlers(aprConfig);
        this.fixedAprTokens = aprConfig.fixedAprHandler;
    }

    buildAprHandlers(aprConfig: IbAprConfig) {
        const handlers: AprHandler[] = [];
        if (aprConfig.aave) {
            for (const config of Object.values(aprConfig.aave)) {
                const aaveHandler = new AaveAprHandler(config);
                handlers.push(aaveHandler);
            }
        }
        if (aprConfig.ankr) {
            const ankrHandler = new AnkrAprHandler(aprConfig.ankr);
            handlers.push(ankrHandler);
        }
        if (aprConfig.beefy) {
            const beefyHandler = new BeefyAprHandler(aprConfig.beefy);
            handlers.push(beefyHandler);
        }
        if (aprConfig.bloom) {
            const bloomAprHandler = new BloomAprHandler(aprConfig.bloom);
            handlers.push(bloomAprHandler);
        }
        if (aprConfig.euler) {
            const eulerHandler = new EulerAprHandler(aprConfig.euler);
            handlers.push(eulerHandler);
        }
        if (aprConfig.gearbox) {
            const gearboxHandler = new GearboxAprHandler(aprConfig.gearbox);
            handlers.push(gearboxHandler);
        }
        if (aprConfig.idle) {
            const idleHandler = new IdleAprHandler(aprConfig.idle);
            handlers.push(idleHandler);
        }
        if (aprConfig.maker) {
            const makerHandler = new MakerAprHandler(aprConfig.maker);
            handlers.push(makerHandler);
        }
        if (aprConfig.ovix) {
            const ovixHandler = new OvixAprHandler({
                ...aprConfig.ovix,
            });
            handlers.push(ovixHandler);
        }
        if (aprConfig.reaper) {
            const reaperCryptHandler = new ReaperCryptAprHandler({ ...aprConfig.reaper });
            handlers.push(reaperCryptHandler);
        }
        if (aprConfig.tessera) {
            const tesseraHandler = new TesseraAprHandler({
                ...aprConfig.tessera,
            });
            handlers.push(tesseraHandler);
        }
        if (aprConfig.tetu) {
            const tetuHandler = new TetuAprHandler(aprConfig.tetu);
            handlers.push(tetuHandler);
        }
        if (aprConfig.tranchess) {
            const tranchessHandler = new TranchessAprHandler(aprConfig.tranchess);
            handlers.push(tranchessHandler);
        }
        if (aprConfig.yearn) {
            const yearnHandler = new YearnAprHandler(aprConfig.yearn);
            handlers.push(yearnHandler);
        }
        if (aprConfig.defaultHandlers) {
            for (const handlerConfig of Object.values(aprConfig.defaultHandlers)) {
                const handler = new DefaultAprHandler(handlerConfig);
                handlers.push(handler);
            }
        }
        return handlers;
    }

    // Any IB Yield tokens (such as rETH, wstETH) need to be added here. Linear Wrapped Tokens must NOT be added here.
    buildIbYieldTokens(aprConfig: IbAprConfig): string[] {
        const ibYieldTokenNamesForDefaultHandler = [
            'rEth',
            'stETH',
            'wstETH',
            'cbETH',
            'sfrxETH',
            'USDR',
            'swETH',
            'wjAURA',
            'qETH',
            'ankrETH',
            'ankrFTM',
            'sFTMx',
            'stMATIC',
            'MATICX',
            'wbETH',
        ].map((token) => token.toLowerCase());

        return [
            ...Object.values(aprConfig?.ankr?.tokens || {}).map((token) => token.address),
            ...Object.keys(aprConfig?.defaultHandlers || {}).filter((handler) =>
                ibYieldTokenNamesForDefaultHandler.includes(handler.toLowerCase()),
            ),
            ...Object.keys(aprConfig?.fixedAprHandler || {}).filter((handler) =>
                ibYieldTokenNamesForDefaultHandler.includes(handler.toLowerCase()),
            ),
        ];
    }

    async fetchAprsFromAllHandlers(): Promise<TokenApr[]> {
        let aprs: TokenApr[] = [];
        for (const handler of this.handlers) {
            const fetchedResponse: { [key: string]: { apr: number; isIbYield: boolean } } = await handler.getAprs();
            for (const [address, { apr, isIbYield }] of Object.entries(fetchedResponse)) {
                aprs.push({
                    apr,
                    isIbYield,
                    group: handler.group,
                    address,
                });
            }
        }
        if (this.fixedAprTokens) {
            for (const { address, apr, isIbYield, group } of Object.values(this.fixedAprTokens)) {
                aprs.push({
                    apr,
                    isIbYield: isIbYield ?? false,
                    group,
                    address,
                });
            }
        }
        return aprs;
    }
}

export interface AprHandler {
    group: string | undefined;
    getAprs(): Promise<{ [tokenAddress: string]: { apr: number; isIbYield: boolean } }>;
}

export type TokenApr = {
    apr: number;
    address: string;
    group?: string;
    isIbYield: boolean;
};
