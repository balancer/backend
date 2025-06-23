import { Chain } from '@prisma/client';

export interface AprHandlerConstructor {
    new (config?: any): YbAprHandler;
}

export interface YbAprHandler {
    group?: string;
    getAprs(chain?: Chain): Promise<{
        [tokenAddress: string]: {
            /** Defined as float, eg: 0.01 is 1% */
            apr: number;
            isIbYield: boolean;
        };
    }>;
}

export type TokenApr = {
    apr: number;
    address: string;
    isIbYield: boolean;
};
