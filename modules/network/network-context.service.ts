import { AllNetworkConfigs, BalancerChainIds, BeethovenChainIds } from './network-config';
import { env } from '../../app/env';
import { Chain } from '@prisma/client';
import { NetworkConfig, NetworkData } from './network-config-types';
import { BaseProvider } from '@ethersproject/providers';
import { getRequestScopeContextValue } from '../context/request-scoped-context';

export class NetworkContextService {
    constructor(private readonly defaultChainId: string) {}

    public isValidChainId(chainId: string) {
        return !!AllNetworkConfigs[chainId];
    }

    public get config(): NetworkConfig {
        const chainId = getRequestScopeContextValue<string>('chainId');

        if (chainId) {
            return AllNetworkConfigs[chainId];
        }

        return AllNetworkConfigs[this.defaultChainId];
    }

    public get data(): NetworkData {
        return this.config.data;
    }

    public get chainId(): string {
        return `${this.data.chain.id}`;
    }

    public get chain(): Chain {
        return this.data.chain.prismaId;
    }

    public get provider(): BaseProvider {
        return this.config.provider;
    }

    public get isFantomNetwork() {
        return this.data.chain.id === 250;
    }

    public get isMainnet() {
        return this.data.chain.id === 1;
    }

    public get isBalancerChain(): boolean {
        return BalancerChainIds.includes(this.chainId);
    }

    public get isBeethovenChain(): boolean {
        return BeethovenChainIds.includes(this.chainId);
    }

    public get protocolSupportedChainIds(): string[] {
        return this.isBalancerChain ? BalancerChainIds : BeethovenChainIds;
    }

    public get services() {
        return this.config.services;
    }
}

export const networkContext = new NetworkContextService(env.DEFAULT_CHAIN_ID);
