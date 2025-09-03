import { YbAprConfig } from '../../token-yields';

export interface AprHandlerConfigs {
    ybAprHandler?: YbAprConfig;
    aaveRewardsAprHandler?: boolean;
    maBeetsAprHandler?: MaBeetsAprConfig;
    morphoRewardsAprHandler?: boolean;
}

export interface MaBeetsAprConfig {
    beetsAddress: string;
}
