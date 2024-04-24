import { Chain } from '@prisma/client';

export interface AprHandlerConstructor {
    new (config?: any): AprHandler;
}

export interface AprHandler {
    group?: string;
    getAprs(chain?: Chain): Promise<{
        [tokenAddress: string]: {
            /** Defined as float, eg: 0.01 is 1% */
            apr: number;
            isIbYield: boolean;
            group?: string;
        };
    }>;
}

export type TokenApr = {
    apr: number;
    address: string;
    isIbYield: boolean;
    group?: string;
};
